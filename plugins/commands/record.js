const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'record',
    version: '1.0.0',
    role: 1, // Admin only
    author: "TDF-2803",
    description: 'Bật/tắt ghi lại lịch sử gửi ảnh',
    category: 'Quản lý',
    usage: '/record history on/off',
    cooldowns: 3
};

module.exports.run = async function ({ api, event, args, Threads }) {
    const { threadId, type } = event;

    if (args[0] !== 'history') {
        return api.sendMessage({
            msg: "❌ Vui lòng dùng: /record history on/off",
            ttl: 300000
        }, threadId, type);
    }

    const mode = args[1];
    if (mode !== 'on' && mode !== 'off') {
        return api.sendMessage({
            msg: "❌ Vui lòng chọn 'on' hoặc 'off'\nVí dụ: /record history on",
            ttl: 300000
        }, threadId, type);
    }

    try {
        const thread = await Threads.getData(threadId);
        const data = thread.data || {};
        const status = mode === 'on';
        data.record_history = status;
        await Threads.setData(threadId, data);

        // If turning ON, create history file with header
        if (status) {
            try {
                const groupInfo = await api.getGroupInfo(threadId);
                const groupName = groupInfo.gridInfoMap?.[threadId]?.name || 'Unknown';

                // Sanitize group name for filename
                const sanitizedName = groupName.replace(/[^a-zA-Z0-9_\-\s\u00C0-\u1EF9]/g, '_');

                const historyDir = path.join(__dirname, '../../data/history_data');
                if (!fs.existsSync(historyDir)) {
                    fs.mkdirSync(historyDir, { recursive: true });
                }

                const historyFile = path.join(historyDir, `history_(${sanitizedName})_${threadId}.txt`);

                // Create file with header if it doesn't exist
                if (!fs.existsSync(historyFile)) {
                    const header = `1:${groupName}:${threadId}\n` +
                        `Bắt đầu ghi: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}\n` +
                        `${'='.repeat(50)}\n\n`;
                    fs.writeFileSync(historyFile, header, 'utf8');
                }
            } catch (err) {
                console.error('Error creating history file:', err);
            }
        }

        const statusText = status ? "BẬT ✅" : "TẮT ❌";
        const msg = `📝 Đã ${statusText} tính năng ghi lại lịch sử gửi ảnh cho nhóm này.\n\n` +
            (status
                ? "✅ Bot sẽ ghi lại tất cả ảnh được gửi vào nhóm.\n📊 Sử dụng /check history <giờ> để xem báo cáo."
                : "❌ Bot sẽ KHÔNG ghi lại ảnh nữa.\n⚠️ Dữ liệu cũ vẫn được giữ lại.");

        return api.sendMessage({ msg: msg, ttl: 300000 }, threadId, type);

    } catch (error) {
        console.error('Error in record command:', error);
        return api.sendMessage({
            msg: "⚠️ Đã xảy ra lỗi khi thay đổi cài đặt.",
            ttl: 300000
        }, threadId, type);
    }
};
