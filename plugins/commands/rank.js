const fs = require('fs');
const path = require('path');

const trackingDir = path.join(__dirname, "../../data/tracking_data");

// Helper to load data
function getFilePath(threadId) {
    if (!fs.existsSync(trackingDir)) {
        fs.mkdirSync(trackingDir, { recursive: true });
    }
    return path.join(trackingDir, `${threadId}.json`);
}

function loadData(threadId) {
    const filePath = getFilePath(threadId);
    if (!fs.existsSync(filePath)) {
        const defaultData = {
            target: 0,
            isRunning: false,
            sosanh: [],
            dagui: [],
            ranks: [],
            firstSenderRecorded: false
        };
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }
    try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (!data.sosanh) data.sosanh = [];
        if (!data.dagui) data.dagui = [];
        if (!data.ranks) data.ranks = [];
        if (typeof data.firstSenderRecorded === 'undefined') data.firstSenderRecorded = false;
        return data;
    } catch (e) {
        return {
            target: 0,
            isRunning: false,
            sosanh: [],
            dagui: [],
            ranks: [],
            firstSenderRecorded: false
        };
    }
}

function saveData(threadId, data) {
    const filePath = getFilePath(threadId);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports.config = {
    name: "rank",
    version: "1.0.0",
    role: 0,
    author: "TDF-2803",
    description: "Xem bảng xếp hạng người gửi ảnh đầu tiên",
    category: "Tracking",
    usage: "/rank",
    cooldowns: 3
};

module.exports.run = async function ({ api, event }) {
    const { threadId, type } = event;

    try {
        const data = loadData(threadId);
        const ranks = data.ranks || [];

        if (ranks.length === 0) {
            return api.sendMessage({
                msg: "📊 Chưa có dữ liệu xếp hạng.\n💡 Xếp hạng dựa trên số lần gửi ảnh đầu tiên mỗi phiên tracking.",
                ttl: 300000
            }, threadId, type);
        }

        // Sort by count descending
        ranks.sort((a, b) => b.count - a.count);

        let msg = "🏆 BẢNG XẾP HẠNG\n";
        msg += "👑 Người gửi ảnh đầu tiên nhiều nhất\n\n";

        ranks.forEach((rank, index) => {
            let medal = "";
            if (index === 0) medal = "🥇";
            else if (index === 1) medal = "🥈";
            else if (index === 2) medal = "🥉";
            else medal = `${index + 1}.`;

            msg += `${medal} ${rank.name}\n`;
            msg += `   📈 Số lần: ${rank.count}\n`;
            msg += `   🆔 UID: ${rank.uid}\n\n`;
        });

        msg += `\n📊 Tổng: ${ranks.length} người`;

        return api.sendMessage({ msg: msg, ttl: 300000 }, threadId, type);

    } catch (error) {
        console.error('Error in rank command:', error);
        return api.sendMessage({
            msg: "⚠️ Lỗi khi xem bảng xếp hạng.",
            ttl: 300000
        }, threadId, type);
    }
};
