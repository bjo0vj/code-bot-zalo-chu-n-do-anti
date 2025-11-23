const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "list",
    version: "1.0.2",
    role: 0,
    author: "TDF-2803",
    description: "Xem danh sách sendall",
    category: "SendAll",
    usage: "/list data_sendall",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadId, messageID, type } = event;

    if (args[0] !== "data_sendall") return;

    const filePath = path.join(__dirname, "../../data/data_sendall", `${threadId}.json`);

    if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Nhóm này chưa tạo database sendall.", threadId, type);
    }

    try {
        let data = JSON.parse(fs.readFileSync(filePath));
        let members = data.members;

        let msg = `📋 DANH SÁCH THÀNH VIÊN (${data.memberCount})\n\n`;

        members.forEach(m => {
            // Simplified display
            msg += `${m.stt}. ${m.name}\n   UID: ${m.uid}\n`;
        });

        return api.sendMessage(msg, threadId, type);
    } catch (e) {
        return api.sendMessage("❌ Có lỗi xảy ra khi đọc danh sách.", threadId, type);
    }
};
