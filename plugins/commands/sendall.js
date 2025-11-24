const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "sendall",
    version: "1.0.0",
    role: 1, // Admin
    author: "TDF-2803",
    description: "Gửi tin nhắn cho tất cả thành viên trong danh sách sendall",
    category: "SendAll",
    usage: "/sendall <nội dung>",
    cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadId, messageID, type, senderID } = event;
    const content = args.join(" ");

    if (!content) {
        return api.sendMessage("❌ Vui lòng nhập nội dung tin nhắn cần gửi!", threadId, type);
    }

    // Check if user is admin (Bot Admin or Group Admin)
    const config = global.config;
    const botAdmins = Array.isArray(config.admin_bot) ? config.admin_bot : [];

    let isGroupAdmin = false;
    try {
        const groupInfo = await api.getGroupInfo(threadId);
        const details = groupInfo.gridInfoMap?.[threadId] || {};
        const adminIds = (details.adminIds || []).map(String);
        const creatorId = String(details.creatorId || "");
        const senderIdStr = String(senderID);

        if (adminIds.includes(senderIdStr) || creatorId === senderIdStr) {
            isGroupAdmin = true;
        }
    } catch (e) {
        console.error("Error checking group admin:", e);
    }

    if (!botAdmins.includes(senderID) && !isGroupAdmin) {
        return api.sendMessage("🚫 Bạn không có quyền sử dụng lệnh này (Cần là Admin Bot hoặc Quản trị viên nhóm).", threadId, type);
    }

    const filePath = path.join(__dirname, "../../data/data_sendall", `${threadId}.json`);

    if (!fs.existsSync(filePath)) {
        return api.sendMessage("❌ Nhóm này chưa có dữ liệu sendall. Vui lòng dùng lệnh '/make file sendall' để tạo.", threadId, type);
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const members = data.members || [];

        if (members.length === 0) {
            return api.sendMessage("⚠️ Danh sách thành viên trống.", threadId, type);
        }

        api.sendMessage(`🔄 Đang gửi tin nhắn đến ${members.length} thành viên...`, threadId, type);

        let successCount = 0;
        let failCount = 0;

        for (const member of members) {
            try {
                await api.sendMessage(`📢 THÔNG BÁO TỪ ADMIN:\n\n${content}`, member.uid);
                successCount++;
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                failCount++;
                console.error(`Failed to send to ${member.uid}:`, e.message);
            }
        }

        return api.sendMessage(`✅ Đã gửi tin nhắn hoàn tất!\n✅ Thành công: ${successCount}\n❌ Thất bại: ${failCount}`, threadId, type);

    } catch (error) {
        console.error(error);
        return api.sendMessage(`❌ Đã xảy ra lỗi khi đọc file dữ liệu: ${error.message}`, threadId, type);
    }
};
