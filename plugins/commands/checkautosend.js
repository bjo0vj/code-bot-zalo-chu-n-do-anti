const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'checkautosend',
    version: '1.0.0',
    role: 0,
    author: "TDF-2803",
    description: 'Kiểm tra nội dung tự động gửi',
    category: "Tiện ích",
    usage: 'checkautosend',
    cooldowns: 2
};

module.exports.run = async ({ api, event, Threads }) => {
    const { threadId, type } = event;

    // Load autosend settings from autosend.js
    const autosendPath = path.join(__dirname, 'autosend.js');

    try {
        // Read the autosend.js file to extract settings
        const autosendContent = fs.readFileSync(autosendPath, 'utf8');

        // Extract the setting array using regex
        const settingMatch = autosendContent.match(/const setting = \[([\s\S]*?)\];/);

        if (!settingMatch) {
            return api.sendMessage("❌ Không thể đọc cấu hình autosend!", threadId, type);
        }

        // Parse the settings manually
        const settingsText = settingMatch[1];
        const timeMatches = [...settingsText.matchAll(/timer:\s*'([^']+)'/g)];
        const messageMatches = [...settingsText.matchAll(/message:\s*\[([\s\S]*?)\]/g)];

        if (timeMatches.length === 0) {
            return api.sendMessage("❌ Không tìm thấy lịch tự động gửi!", threadId, type);
        }

        // Check if autosend is enabled for this thread
        const thread = await Threads.getData(threadId);
        const isEnabled = thread.data.auto_send || false;

        let msg = `📋 LỊCH TỰ ĐỘNG GỬI TIN NHẮN\n\n`;
        msg += `📊 Trạng thái: ${isEnabled ? "✅ Đang bật" : "❌ Đang tắt"}\n\n`;
        msg += `⏰ Danh sách thời gian:\n\n`;

        timeMatches.forEach((match, index) => {
            const time = match[1];
            const messagesText = messageMatches[index] ? messageMatches[index][1] : '';
            const messages = [...messagesText.matchAll(/'([^']+)'/g)].map(m => m[1]);

            msg += `${index + 1}. Thời gian: ${time}\n`;
            msg += `   📝 Nội dung (${messages.length} tin nhắn):\n`;
            messages.forEach((message, idx) => {
                msg += `   ${idx + 1}. ${message}\n`;
            });
            msg += `\n`;
        });

        msg += `💡 Sử dụng:\n`;
        msg += `• /autosend on - Bật tự động gửi\n`;
        msg += `• /autosend off - Tắt tự động gửi`;

        return api.sendMessage(msg, threadId, type);
    } catch (error) {
        console.error("Error reading autosend config:", error);
        return api.sendMessage(`❌ Lỗi khi đọc cấu hình: ${error.message}`, threadId, type);
    }
};
