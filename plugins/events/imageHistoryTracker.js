const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'imageHistoryTracker',
    event_type: ['message'],
    version: '2.3.0',
    author: "TDF-2803",
    description: 'Ghi lại lịch sử gửi ảnh (Append-only)'
};

let groupNames = {}; // Cache group names: { threadId: groupName }
let api = null;

async function getGroupName(threadId) {
    if (groupNames[threadId]) return groupNames[threadId];

    try {
        const groupInfo = await api.getGroupInfo(threadId);
        const name = groupInfo.gridInfoMap?.[threadId]?.name || 'Unknown';
        // Sanitize filename: remove special chars, keep alphanumeric, underscores, hyphens, spaces
        groupNames[threadId] = name.replace(/[^a-zA-Z0-9_\-\s\u00C0-\u1EF9]/g, '_');
        return groupNames[threadId];
    } catch (e) {
        console.error('Error getting group name:', e);
        groupNames[threadId] = 'Unknown';
        return 'Unknown';
    }
}

async function getHistoryFilePath(threadId) {
    const historyDir = path.join(__dirname, '../../data/history_data');
    if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
    }

    const groupName = await getGroupName(threadId);
    return path.join(historyDir, `history_(${groupName})_${threadId}.txt`);
}

module.exports.onLoad = function ({ api: apiInstance }) {
    api = apiInstance;
};

module.exports.run = async function ({ api: apiInstance, event, Threads }) {
    if (!api) api = apiInstance;
    const { threadId, data } = event;

    console.log('[ImageHistoryTracker] Event received:', {
        isGroup: event.isGroup,
        threadId: threadId,
        msgType: data?.msgType
    });

    // Fix: isGroup might be undefined. Check if threadId exists and is different from senderID (or just rely on threadId)
    // In Zalo, group threadIds are usually different from user IDs.
    // If isGroup is explicitly false, return. If undefined, proceed if threadId exists.
    if (event.isGroup === false) return;
    if (!threadId) return;

    // Check if recording is enabled for this group
    try {
        const threadData = await Threads.getData(threadId);
        // Threads.getData returns the data object directly, not wrapped in { data: ... }
        // So we access record_history directly from threadData
        const recordEnabled = threadData && threadData.record_history;

        console.log('[ImageHistoryTracker] Recording status:', {
            threadId: threadId,
            recordEnabled: recordEnabled,
            data: threadData
        });

        if (!recordEnabled) {
            console.log('[ImageHistoryTracker] Recording disabled for this group');
            return; // Recording disabled for this group
        }
    } catch (e) {
        console.error('[ImageHistoryTracker] Error checking record_history setting:', e);
        return; // Skip if error
    }

    const msgType = data?.msgType;
    console.log('[ImageHistoryTracker] Inspecting attachments:', JSON.stringify(event.attachments, null, 2));
    console.log('[ImageHistoryTracker] msgType:', msgType);

    // Count images
    let imageCount = 0;
    if (event.attachments && event.attachments.length > 0) {
        imageCount = event.attachments.filter(att =>
            att.type === 'photo' || att.type === 'image' ||
            (att.url && (att.url.includes('.jpg') || att.url.includes('.png') || att.url.includes('.gif')))
        ).length;
    } else if (msgType === 'chat.photo') {
        imageCount = 1;
    }

    if (imageCount === 0) return;

    const senderID = data.uidFrom || event.senderID;
    if (!senderID) return;

    const filePath = await getHistoryFilePath(threadId);
    const timestamp = Date.now();

    // Get readable time string (Asia/Ho_Chi_Minh)
    const timeString = new Date(timestamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

    // Get user name
    let name = "Người dùng";
    if (data && data.dName) {
        name = data.dName;
    } else {
        try {
            const info = await api.getUserInfo(senderID);
            if (info) {
                if (info.changed_profiles && info.changed_profiles[senderID]) {
                    name = info.changed_profiles[senderID].displayName || name;
                } else if (info[senderID]) {
                    name = info[senderID].name || info[senderID].displayName || name;
                }
            }
        } catch (e) {
            console.error('Error getting user info:', e);
        }
    }

    // Format: timeString | name | uid | count | timestamp
    const line = `${timeString} | ${name} | ${senderID} | ${imageCount} | ${timestamp}\n`;

    try {
        fs.appendFileSync(filePath, line, 'utf8');
    } catch (e) {
        console.error('Error appending to history file:', e);
    }
};
