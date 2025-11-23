const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'ram',
    version: '1.0.0',
    role: 0, // All users can check status
    author: "Assistant",
    description: 'Xem trạng thái hệ thống RAM của bot',
    category: 'Hệ thống',
    usage: 'ram',
    cooldowns: 2,
    dependencies: {}
};

module.exports.run = async ({ event, api }) => {
    const { threadId, type } = event;
    const name_bot = global.config.name_bot;

    // Hàm lấy mức RAM sử dụng
    const getRAMUsage = () => {
        const used = process.memoryUsage();
        return {
            rss: (used.rss / 1024 / 1024).toFixed(2),
            heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2)
        };
    };

    const isRunning = !!global.ramLoggingInterval;
    const ram = getRAMUsage();

    let statusMsg = `${name_bot}\n📊 Hệ thống RAM Monitor\n\n`;
    statusMsg += `🔹 Trạng thái logging: ${isRunning ? '✅ Đang chạy' : '⛔ Đã tắt'}\n`;
    statusMsg += `🔹 RAM hiện tại: ${ram.heapUsed} MB\n`;
    statusMsg += `🔹 Tổng RAM: ${ram.rss} MB\n\n`;
    statusMsg += `� Lệnh có sẵn:\n`;
    statusMsg += `• /ramon - Bật logging RAM\n`;
    statusMsg += `• /ramoff - Tắt logging RAM\n`;
    statusMsg += `• /checkram - Xem TB 120s`;

    await api.sendMessage({
        msg: statusMsg,
        ttl: 60000
    }, threadId, type);
};
