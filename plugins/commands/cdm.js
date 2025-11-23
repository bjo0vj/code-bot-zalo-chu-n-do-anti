const axios = require("axios");

module.exports.config = {
    name: "cdm",
    version: "1.1.2",
    role: 0,
    author: "TDF-2803",
    description: "Kiểm tra thông tin tên miền qua whois.inet.vn.",
    category: "Tiện ích",
    usage: "cdm <tên miền>",
    cooldowns: 5,
    dependencies: { "axios": "" }
};

module.exports.run = async function({ api, event, args }) {
    const { threadId, type } = event;

    if (!args[0]) {
        return api.sendMessage("Vui lòng nhập tên miền cần kiểm tra (ví dụ: google.com).", threadId, type);
    }

    const domain = args[0];

    try {
        const response = await axios.get(`https://whois.inet.vn/api/whois/domainspecify/${domain}`, {
            headers: {
                referer: `https://whois.inet.vn/whois?domain=${domain}`,
                'user-agent': 'Mozilla/5.0'
            }
        });

        const data = response.data;

        if (data.code === "0") {
            const created = data.creationDate || 'Không rõ';
            const expired = data.expirationDate || 'Không rõ';
            const registrar = data.registrar || 'Không rõ';
            const registrant = data.registrantName || 'Không rõ';
            const dnsList = Array.isArray(data.nameServer) ? data.nameServer.join(', ') : 'Không rõ';

            const msg = `🔎 Thông tin tên miền: ${domain}\n\n` +
                `- 📌 Trạng thái: Đã đăng ký\n` +
                `- 📅 Ngày đăng ký: ${created}\n` +
                `- ⏳ Ngày hết hạn: ${expired}\n` +
                `- 🏢 Nhà đăng ký: ${registrar}\n` +
                `- 👤 Chủ sở hữu: ${registrant}\n` +
                `- 🌐 NameServer: ${dnsList}\n`;

            await api.sendMessage(msg, threadId, type);

        } else if (data.code === "1") {
            const fee = data.fee?.toLocaleString('vi-VN') || "Không rõ";
            const feeOrigin = data.feeOrigin?.toLocaleString('vi-VN') || "Không rõ";

            const msg = `🔍 Tên miền ${domain} chưa được đăng ký.\n\n` +
                `💵 Giá gốc: ${feeOrigin}₫\n` +
                `🔥 Giá khuyến mãi: ${fee}₫\n`;

            await api.sendMessage(msg, threadId, type);
        } else {
            await api.sendMessage(`⚠️ Không xác định được trạng thái tên miền "${domain}".`, threadId, type);
        }

    } catch (error) {
        console.error(`[cdm] Lỗi kiểm tra tên miền ${domain}:`, error.response?.data || error.message);
        return api.sendMessage(`❌ Đã xảy ra lỗi khi kiểm tra tên miền "${domain}".`, threadId, type);
    }
};
