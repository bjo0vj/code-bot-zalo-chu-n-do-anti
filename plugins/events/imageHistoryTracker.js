const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'imageHistoryTracker',
    event_type: ['message'],
    version: '2.4.0',
    author: 'Bot',
    description: 'Ghi lại lịch sử gửi ảnh (Database Version)'
};

let api = null;

module.exports.onLoad = function ({ api: apiInstance }) {
    api = apiInstance;
};

module.exports.run = async function ({ api: apiInstance, event }) {
    if (!api) api = apiInstance;
    const { threadId, data } = event;
    if (!event.isGroup) return; // Only track group messages
    const msgType = data?.msgType;

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

    const timestamp = Date.now();

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

    // Save to Database
    if (global.database) {
        await global.database.addHistory(threadId, senderID, name, imageCount, timestamp);
    }
};
