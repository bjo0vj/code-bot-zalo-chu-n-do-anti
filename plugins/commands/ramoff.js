const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'ramoff',
    version: '1.0.0',
    role: 1, // Admin only
    author: "Assistant",
    description: 'Tắt ghi nhật ký RAM',
    category: 'Hệ thống',
    usage: 'ramoff',
    cooldowns: 2,
    dependencies: {}
};

module.exports.run = async ({ event, api }) => {
    const { threadId, type } = event;
    const name_bot = global.config.name_bot;

    const ramFilePath = path.join(__dirname, '..', '..', 'useram.txt');

    // Kiểm tra nếu chưa bật
    if (!global.ramLoggingInterval) {
        return await api.sendMessage({
            msg: `${name_bot}\n⚠️ RAM logging chưa được bật!`,
            ttl: 60000
        }, threadId, type);
    }

    // Dừng logging
    clearInterval(global.ramLoggingInterval);
    global.ramLoggingInterval = null;

    // Ghi dòng kết thúc
    fs.appendFileSync(ramFilePath, `=== RAM Logging Stopped at ${new Date().toLocaleString('vi-VN')} ===\n`);

    await api.sendMessage({
        msg: `${name_bot}\n⛔ Đã tắt RAM logging!\n📝 Dữ liệu đã được lưu vào useram.txt`,
        ttl: 60000
    }, threadId, type);
};
