module.exports.config = {
    name: 'on',
    version: '1.0.0',
    role: 0, // All users can use
    author: "TDF-2803",
    description: 'Kiểm tra bot có hoạt động không',
    category: 'Hệ thống',
    usage: 'on',
    cooldowns: 2,
    dependencies: {}
};

module.exports.run = async ({ event, api }) => {
    const { threadId, type } = event;
    const name_bot = global.config.name_bot || "Bot";

    // Tính thời gian bot đã chạy (uptime)
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    // Lấy thông tin RAM
    const used = process.memoryUsage();
    const ramUsed = (used.heapUsed / 1024 / 1024).toFixed(2);
    const ramTotal = (used.rss / 1024 / 1024).toFixed(2);

    // Tạo message
    let msg = `✅ ${name_bot} ĐANG HOẠT ĐỘNG!\n\n`;
    msg += `⏱️ Thời gian hoạt động:\n`;
    msg += `   ${hours} giờ ${minutes} phút ${seconds} giây\n\n`;
    msg += `💾 RAM đang dùng: ${ramUsed} MB\n`;
    msg += `📊 Tổng RAM: ${ramTotal} MB\n\n`;
    msg += `🤖 Bot đã sẵn sàng phục vụ!`;

    await api.sendMessage({
        msg: msg,
        ttl: 30000 // Tự động xóa sau 30 giây
    }, threadId, type);
};
