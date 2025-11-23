module.exports.config = {
    name: 'checkram',
    version: '1.0.0',
    role: 0, // All users can check
    author: "Assistant",
    description: 'Xem thống kê RAM trong 120s gần nhất (Hệ thống lưu tối đa 600s)',
    category: 'Hệ thống',
    usage: 'checkram',
    cooldowns: 2,
    dependencies: {}
};

module.exports.run = async ({ event, api }) => {
    const { threadId, type } = event;
    const name_bot = global.config.name_bot;

    // Hàm lấy RAM hiện tại
    const getCurrentRAM = () => {
        const used = process.memoryUsage();
        return {
            rss: (used.rss / 1024 / 1024).toFixed(2),
            heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2)
        };
    };

    const currentRAM = getCurrentRAM();

    // Kiểm tra xem có lịch sử RAM không
    if (!global.ramHistory || global.ramHistory.length === 0) {
        return await api.sendMessage({
            msg: `${name_bot}\n📊 Tình trạng RAM\n\n` +
                `🔹 RAM hiện tại: ${currentRAM.heapUsed} MB\n` +
                `🔹 Tổng RAM: ${currentRAM.rss} MB\n\n` +
                `⚠️ Chưa có dữ liệu lịch sử RAM!\n` +
                `💡 Sử dụng /ramon để bắt đầu theo dõi`,
            ttl: 60000
        }, threadId, type);
    }

    // Tính toán thống kê
    const now = Date.now();
    const validEntries = global.ramHistory.filter(entry =>
        now - entry.timestamp <= 120000 // Chỉ lấy 120 giây gần nhất
    );

    if (validEntries.length === 0) {
        return await api.sendMessage({
            msg: `${name_bot}\n⚠️ Không có dữ liệu RAM trong 120 giây gần nhất!\n💡 Hãy đợi một chút sau khi bật /ramon`,
            ttl: 60000
        }, threadId, type);
    }

    // Tính trung bình, min, max
    const ramValues = validEntries.map(e => e.ramUsed);
    const avgRAM = (ramValues.reduce((a, b) => a + b, 0) / ramValues.length).toFixed(2);
    const minRAM = Math.min(...ramValues).toFixed(2);
    const maxRAM = Math.max(...ramValues).toFixed(2);

    // Tính thời gian theo dõi thực tế
    const oldestTimestamp = validEntries[0].timestamp;
    const trackingDuration = Math.floor((now - oldestTimestamp) / 1000);

    // Tính tổng số dữ liệu có sẵn trong bộ nhớ
    const totalStoredSeconds = global.ramHistory.length;
    const oldestStoredTime = global.ramHistory.length > 0 ? Math.floor((now - global.ramHistory[0].timestamp) / 1000) : 0;

    let msg = `${name_bot}\n📊 Báo cáo RAM (${trackingDuration}s gần nhất)\n\n`;
    msg += `🔹 Số mẫu: ${validEntries.length} lần đo\n`;
    msg += `🔹 RAM trung bình/s: ${avgRAM} MB\n`;
    msg += `🔹 RAM thấp nhất: ${minRAM} MB\n`;
    msg += `🔹 RAM cao nhất: ${maxRAM} MB\n`;
    msg += `🔹 Chênh lệch: ${(maxRAM - minRAM).toFixed(2)} MB\n\n`;
    msg += `🔹 RAM hiện tại: ${currentRAM.heapUsed} MB\n`;
    msg += `🔹 Tổng RAM: ${currentRAM.rss} MB\n\n`;
    msg += `📦 Dữ liệu lưu trữ: ${totalStoredSeconds} mẫu (${oldestStoredTime}s)\n`;
    msg += `🗑️ Tự động xóa data > 600s\n\n`;
    msg += `💡 Sử dụng /ramon để tiếp tục theo dõi\n`;
    msg += `💡 Sử dụng /ramoff để dừng theo dõi`;

    await api.sendMessage({
        msg: msg,
        ttl: 60000
    }, threadId, type);
};
