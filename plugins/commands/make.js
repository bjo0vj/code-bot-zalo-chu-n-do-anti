const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "make",
    version: "1.0.5",
    role: 1, // Admin group or Bot Admin
    author: "TDF-2803",
    description: "Tạo database sendall cho nhóm",
    category: "SendAll",
    usage: "/make file sendall",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Threads, Users }) {
    const { threadId, messageID, type, participantIDs: eventParticipantIDs } = event;

    if (args[0] !== "file" || (args[1] !== "sendall" && args[1] !== "sosanh")) {
        return api.sendMessage("❌ Cú pháp không đúng. Vui lòng dùng: /make file sendall hoặc /make file sosanh", threadId, type);
    }

    // Handle /make file sosanh
    if (args[1] === "sosanh") {
        try {
            const groupInfo = await api.getGroupInfo(threadId);
            const details = groupInfo.gridInfoMap?.[threadId] || {};
            const groupName = details.name || "Unnamed Group";

            let participantIDs = [];
            // Try to get from memVerList (e.g., "UID_0")
            if (details.memVerList && Array.isArray(details.memVerList)) {
                participantIDs = details.memVerList.map(item => item.split('_')[0]);
            }
            // Fallback to other methods if memVerList is empty
            if (participantIDs.length === 0) {
                participantIDs = eventParticipantIDs;
            }
            if (!participantIDs || participantIDs.length === 0) {
                participantIDs = details.participantIDs || details.members;
            }
            if ((!participantIDs || participantIDs.length === 0) && details.userInfoMap) {
                participantIDs = Object.keys(details.userInfoMap);
            }
            if (!participantIDs || participantIDs.length === 0) {
                const admins = details.adminIds || [];
                const creator = details.creatorId;
                participantIDs = [...admins];
                if (creator && !participantIDs.includes(creator)) participantIDs.push(creator);
                const senderID = event.senderID || event.data?.uidFrom;
                if (senderID && !participantIDs.includes(senderID)) participantIDs.push(senderID);
            }

            // Deduplicate
            participantIDs = [...new Set(participantIDs)];

            const trackingDir = path.join(__dirname, "../../data/tracking_data");
            if (!fs.existsSync(trackingDir)) {
                fs.mkdirSync(trackingDir, { recursive: true });
            }

            const sosanhList = [];

            for (const uid of participantIDs) {
                let name = "Người dùng Facebook";
                try {
                    const userInfo = await Users.getData(uid);
                    if (userInfo && userInfo.name) {
                        name = userInfo.name;
                    } else {
                        const info = await api.getUserInfo(uid);
                        if (info && info.changed_profiles && info.changed_profiles[uid]) {
                            name = info.changed_profiles[uid].displayName || name;
                        } else if (info && info[uid]) {
                            name = info[uid].name || info[uid].displayName || name;
                        }
                    }
                } catch (e) { }

                sosanhList.push({ uid: uid, name: name });
            }

            // Load existing data or create new
            const filePath = path.join(trackingDir, `${threadId}.json`);
            let data = {};
            if (fs.existsSync(filePath)) {
                try {
                    data = JSON.parse(fs.readFileSync(filePath, "utf8"));
                } catch (e) {
                    data = { target: 0, isRunning: false, sosanh: [], dagui: [] };
                }
            } else {
                data = { target: 0, isRunning: false, sosanh: [], dagui: [] };
            }

            // Update sosanh list
            data.sosanh = sosanhList;

            // Ensure other fields exist
            if (!data.dagui) data.dagui = [];
            if (typeof data.target === 'undefined') data.target = 0;
            if (typeof data.isRunning === 'undefined') data.isRunning = false;

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

            return api.sendMessage(`✅ Đã tạo danh sách so sánh thành công cho nhóm: ${groupName}\n📁 Số thành viên: ${sosanhList.length}`, threadId, type);

        } catch (error) {
            console.error(error);
            return api.sendMessage(`❌ Đã xảy ra lỗi khi tạo danh sách so sánh: ${error.message}`, threadId, type);
        }
    }

    try {
        const groupInfo = await api.getGroupInfo(threadId);
        const details = groupInfo.gridInfoMap?.[threadId] || {};
        const groupName = details.name || "Unnamed Group";

        let participantIDs = [];

        // Try to get from memVerList (e.g., "UID_0")
        if (details.memVerList && Array.isArray(details.memVerList)) {
            participantIDs = details.memVerList.map(item => item.split('_')[0]);
        }

        // Fallback to other methods if memVerList is empty
        if (participantIDs.length === 0) {
            participantIDs = eventParticipantIDs;
        }

        if (!participantIDs || participantIDs.length === 0) {
            participantIDs = details.participantIDs || details.members;
        }

        if ((!participantIDs || participantIDs.length === 0) && details.userInfoMap) {
            participantIDs = Object.keys(details.userInfoMap);
        }

        if (!participantIDs || participantIDs.length === 0) {
            const admins = details.adminIds || [];
            const creator = details.creatorId;
            participantIDs = [...admins];
            if (creator && !participantIDs.includes(creator)) participantIDs.push(creator);

            const senderID = event.senderID || event.data?.uidFrom;
            if (senderID && !participantIDs.includes(senderID)) participantIDs.push(senderID);

            if (participantIDs.length <= 1) {
                api.sendMessage("⚠️ Không thể lấy danh sách thành viên đầy đủ. File sẽ được tạo với danh sách hiện có.", threadId, type);
            }
        }

        // Deduplicate
        participantIDs = [...new Set(participantIDs)];

        const dirPath = path.join(__dirname, "../../data/data_sendall");
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const usersData = [];
        let stt = 1;

        for (const uid of participantIDs) {
            let name = "Người dùng Facebook";
            try {
                const userInfo = await Users.getData(uid);
                if (userInfo && userInfo.name) {
                    name = userInfo.name;
                } else {
                    const info = await api.getUserInfo(uid);
                    if (info && info.changed_profiles && info.changed_profiles[uid]) {
                        name = info.changed_profiles[uid].displayName || name;
                    } else if (info && info[uid]) {
                        name = info[uid].name || info[uid].displayName || name;
                    }
                }
            } catch (e) { }

            usersData.push({
                stt: stt++,
                name: name,
                uid: uid
            });
        }

        usersData.sort((a, b) => a.name.localeCompare(b.name));

        usersData.forEach((user, index) => {
            user.stt = index + 1;
        });

        const filePath = path.join(dirPath, `${threadId}.json`);

        // New structure: stt : groupname : uuid : membercount
        const fileContent = {
            stt: 1,
            groupName: groupName,
            uuid: threadId,
            memberCount: usersData.length,
            lastUpdate: new Date().toISOString(),
            members: usersData
        };

        fs.writeFileSync(filePath, JSON.stringify(fileContent, null, 4));

        return api.sendMessage(`✅ Đã tạo file database sendall thành công!\n📋 STT: 1\n📂 Tên nhóm: ${groupName}\n🆔 UUID: ${threadId}\n👥 Tổng thành viên: ${usersData.length}`, threadId, type);

    } catch (error) {
        console.error(error);
        return api.sendMessage(`❌ Đã xảy ra lỗi khi tạo file database: ${error.message}`, threadId, type);
    }
};
