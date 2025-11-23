const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "remove",
    version: "1.0.1",
    role: 0,
    author: "TDF-2803",
    description: "Xóa thành viên khỏi database sendall",
    category: "SendAll",
    usage: "/remove data_sendall (tự xóa) hoặc /remove data_sendall:@tag (admin xóa)",
    cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
    const { threadId, messageID, senderID, mentions, type } = event;

    if (args[0] !== "data_sendall") return;

    const filePath = path.join(__dirname, "../../data/data_sendall", `${threadId}.json`);

    if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Nhóm này chưa tạo database sendall.", threadId, type);
    }

    let data = JSON.parse(fs.readFileSync(filePath));
    let members = data.members;
    let removedCount = 0;

    const targetUIDs = [];

    if (Object.keys(mentions).length > 0) {
        const config = global.config;
        const adminBot = config.admin_bot || [];
        if (!adminBot.includes(senderID)) {
            return api.sendMessage("⚠️ Chỉ Admin mới có thể xóa người khác.", threadId, type);
        }

        for (const uid in mentions) {
            targetUIDs.push(uid);
        }
    } else {
        targetUIDs.push(senderID);
    }

    const initialLength = members.length;
    members = members.filter(m => !targetUIDs.includes(m.uid));
    removedCount = initialLength - members.length;

    if (removedCount === 0) {
        return api.sendMessage("⚠️ Người dùng không có trong danh sách.", threadId, type);
    }

    members.sort((a, b) => a.name.localeCompare(b.name));
    members.forEach((m, i) => m.stt = i + 1);

    data.members = members;
    data.memberCount = members.length;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

    return api.sendMessage(`✅ Đã xóa ${removedCount} thành viên khỏi danh sách.`, threadId, type);
};
