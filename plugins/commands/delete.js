const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "delete",
    version: "1.0.0",
    role: 1, // Admin group or Bot Admin
    author: "TDF-2803",
    description: "Xóa database sendall của nhóm",
    category: "SendAll",
    usage: "/delete file sendall",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
    const { threadId, messageID, type } = event;

    if (args[0] !== "file" || args[1] !== "sendall") {
        return api.sendMessage("❌ Cú pháp không đúng. Vui lòng dùng: /delete file sendall", threadId, type);
    }

    const filePath = path.join(__dirname, "../../data/data_sendall", `${threadId}.json`);

    if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Nhóm này chưa tạo database sendall.", threadId, type);
    }

    try {
        fs.unlinkSync(filePath);
        return api.sendMessage("✅ Đã xóa file database sendall của nhóm thành công.", threadId, type);
    } catch (error) {
        console.error(error);
        return api.sendMessage("❌ Đã xảy ra lỗi khi xóa file database.", threadId, type);
    }
};
