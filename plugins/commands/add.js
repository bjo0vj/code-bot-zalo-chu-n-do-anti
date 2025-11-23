const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "add",
    version: "1.0.4",
    role: 0,
    author: "TDF-2803",
    description: "Thêm thành viên vào database sendall",
    category: "SendAll",
    usage: "/add data_sendall (tự thêm) hoặc /add data_sendall:@tag (admin thêm)",
    cooldowns: 2
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadId, messageID, senderID, mentions, type } = event;

    if (args[0] !== "data_sendall") return;

    const filePath = path.join(__dirname, "../../data/data_sendall", `${threadId}.json`);

    if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Nhóm này chưa tạo database sendall. Vui lòng dùng lệnh /make file sendall trước.", threadId, type);
    }

    let data = JSON.parse(fs.readFileSync(filePath));
    let members = data.members;
    let addedCount = 0;

    const targetUIDs = [];

    if (Object.keys(mentions).length > 0) {
        const config = global.config;
        const adminBot = config.admin_bot || [];
        if (!adminBot.includes(senderID)) {
            return api.sendMessage("⚠️ Chỉ Admin mới có thể thêm người khác.", threadId, type);
        }

        for (const uid in mentions) {
            targetUIDs.push({ uid, name: mentions[uid].replace("@", "") });
        }
    } else {
        // Self add
        let name = "Người dùng Facebook";
        try {
            const info = await api.getUserInfo(senderID);
            if (info && info.changed_profiles && info.changed_profiles[senderID]) {
                name = info.changed_profiles[senderID].displayName || name;
            } else if (info && info[senderID]) {
                name = info[senderID].name || info[senderID].displayName || name;
            }
        } catch (e) { }
        targetUIDs.push({ uid: senderID, name });
    }

    for (const target of targetUIDs) {
        if (members.some(m => m.uid == target.uid)) {
            continue;
        }

        // Simplified structure
        members.push({
            stt: 0,
            name: target.name,
            uid: target.uid
        });
        addedCount++;
    }

    if (addedCount === 0) {
        return api.sendMessage("⚠️ Người dùng đã có trong danh sách hoặc không có ai để thêm.", threadId, type);
    }

    members.sort((a, b) => a.name.localeCompare(b.name));
    members.forEach((m, i) => m.stt = i + 1);

    data.members = members;
    data.memberCount = members.length;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

    return api.sendMessage(`✅ Đã thêm ${addedCount} thành viên vào danh sách.`, threadId, type);
};
