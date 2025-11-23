const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'ramon',
    version: '1.0.0',
    role: 1, // Admin only
    author: "Assistant",
    description: 'Bật ghi nhật ký RAM vào file useram.txt (cập nhật mỗi giây)',
    category: 'Hệ thống',
    usage: 'ramon',
    cooldowns: 2,
    dependencies: {}
};

// Global variables để lưu interval và lịch sử RAM
global.ramLoggingInterval = global.ramLoggingInterval || null;
global.ramHistory = global.ramHistory || [];

module.exports.run = async ({ event, api }) => {
    const { threadId, type } = event;
    const name_bot = global.config.name_bot;

    const ramFilePath = path.join(__dirname, '..', '..', 'useram.txt');

    // Kiểm tra nếu đã bật
    if (global.ramLoggingInterval) {
        return await api.sendMessage({
            msg: `${name_bot}\n⚠️ RAM logging đã được bật từ trước!`,
            ttl: 60000
        }, threadId, type);
    }

    // Hàm lấy mức RAM sử dụng
    const getRAMUsage = () => {
        const used = process.memoryUsage();
        return {
            rss: (used.rss / 1024 / 1024).toFixed(2), // Resident Set Size - tổng bộ nhớ
            heapTotal: (used.heapTotal / 1024 / 1024).toFixed(2),
            heapUsed: (used.heapUsed / 1024 / 1024).toFixed(2),
            external: (used.external / 1024 / 1024).toFixed(2)
        };
    };

    // Hàm ghi RAM vào file và lưu vào lịch sử
    const logRAM = () => {
        const now = new Date();
        const timeStr = now.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });

        const ram = getRAMUsage();
        const ramUsedMB = parseFloat(ram.heapUsed);
        const logLine = `${timeStr} : ${ram.heapUsed} MB (Total: ${ram.rss} MB)\n`;

        // Ghi vào file
        fs.appendFile(ramFilePath, logLine, (err) => {
            if (err) {
                console.error('Lỗi khi ghi file RAM:', err);
            }
        });

        // Lưu vào lịch sử (chỉ giữ 600 giây gần nhất để tránh đầy bộ nhớ)
        global.ramHistory.push({
            timestamp: Date.now(),
            ramUsed: ramUsedMB
        });

        // Tự động xóa các mục cũ hơn 600 giây (10 phút) để tránh tràn bộ nhớ
        const cutoffTime = Date.now() - 600000; // 600 giây = 600000ms
        global.ramHistory = global.ramHistory.filter(entry => entry.timestamp > cutoffTime);
    };

    // Tạo hoặc xóa nội dung file cũ
    fs.writeFileSync(ramFilePath, `=== RAM Logging Started at ${new Date().toLocaleString('vi-VN')} ===\n`);

    // Reset lịch sử RAM
    global.ramHistory = [];

    // Bắt đầu logging mỗi giây
    global.ramLoggingInterval = setInterval(logRAM, 1000);

    await api.sendMessage({
        msg: `${name_bot}\n✅ Đã bật RAM logging!\n📝 File: useram.txt\n⏱️ Cập nhật: mỗi 1 giây\n🗑️ Tự động xóa data cũ hơn 600s\n\n💡 Sử dụng /ramoff để tắt\n💡 Sử dụng /checkram để xem TB 120s`,
        ttl: 60000
    }, threadId, type);
};
