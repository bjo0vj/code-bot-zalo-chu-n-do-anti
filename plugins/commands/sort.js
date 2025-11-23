const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "sort",
    version: "1.0.1",
    role: 1, // Admin
    author: "TDF-2803",
    description: "Sắp xếp lại danh sách sendall",
    category: "SendAll",
    usage: "/sort data_sendall",
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

        members.sort((a, b) => a.name.localeCompare(b.name));
        members.forEach((m, i) => m.stt = i + 1);

        data.members = members;

        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

        return api.sendMessage("✅ Đã sắp xếp lại danh sách thành công.", threadId, type);
    } catch (e) {
        return api.sendMessage("❌ Có lỗi xảy ra khi sắp xếp.", threadId, type);
    }
};
