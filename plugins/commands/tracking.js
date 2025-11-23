const fs = require("fs");
const path = require("path");

// DB Helper: Get session data
async function loadData(threadId) {
    if (!global.database) return { target: 0, isRunning: false, sosanh: [], dagui: [] };
    const data = await global.database.getSession(threadId);
    return data || { target: 0, isRunning: false, sosanh: [], dagui: [] };
}

// DB Helper: Save session data
async function saveData(threadId, data) {
    if (!global.database) return;
    await global.database.saveSession(threadId, data);
}

module.exports.config = {
    name: "tracking",
    version: "2.0.0",
    role: 0,
    author: "Bot Tu Code",
    description: "Quản lý điểm danh gửi ảnh (Database Version)",
    category: "Tiện ích",
    usage: "/addten, /setnguoi <số lượng>, /start, /check, /stop, /check history <giờ>",
    cooldowns: 5,
    aliases: ["addten", "setnguoi", "start", "check", "stop", "checkdagui", "checksosanh", "cleardagui", "clearsosanh"]
};

module.exports.run = async function ({ api, event, args }) {
    const { threadId, type } = event;
    const senderID = event.senderID || event.data?.uidFrom;
    const body = event.body || event.data?.content || "";

    let data = await loadData(threadId);

    // Helper to get group name
    const getGroupName = async () => {
        try {
            const groupInfo = await api.getGroupInfo(threadId);
            return groupInfo.gridInfoMap?.[threadId]?.name || "Nhóm chưa đặt tên";
        } catch (e) {
            return "Không thể lấy tên nhóm";
        }
    };

    // Helper to check admin
    const isAdmin = () => {
        const admins = global.config.admin_bot || [];
        return admins.includes(senderID);
    };

    // /addten
    if (body.startsWith("/addten")) {
        try {
            if (!senderID) {
                return api.sendMessage({ msg: "⚠️ Không tìm thấy ID người dùng.", ttl: 300000 }, threadId, type);
            }

            let name = "Người dùng";
            try {
                const info = await api.getUserInfo(senderID);
                if (info && info.changed_profiles && info.changed_profiles[senderID]) {
                    name = info.changed_profiles[senderID].displayName || name;
                } else if (info && info[senderID]) {
                    name = info[senderID].name || info[senderID].displayName || name;
                }
            } catch (err) {
                console.error("Error getting user info:", err);
            }

            const exists = data.sosanh.some(u => u.uid === senderID);
            if (exists) {
                return api.sendMessage({ msg: `⚠️ Bạn (${name}) đã có trong danh sách so sánh rồi!`, ttl: 300000 }, threadId, type);
            }

            data.sosanh.push({ uid: senderID, name: name });
            await saveData(threadId, data);

            const groupName = await getGroupName();
            return api.sendMessage({ msg: `✅ Đã thêm ${name} vào danh sách so sánh.\n📂 Tên nhóm: ${groupName}\n🆔 ID nhóm: ${threadId}`, ttl: 300000 }, threadId, type);
        } catch (e) {
            console.error(e);
            return api.sendMessage({ msg: "⚠️ Đã xảy ra lỗi khi thêm tên.", ttl: 300000 }, threadId, type);
        }
    }

    // /setnguoi <number> (Admin only)
    if (body.startsWith("/setnguoi")) {
        if (!isAdmin()) {
            return api.sendMessage({ msg: "⚠️ Bạn không có quyền sử dụng lệnh này.", ttl: 300000 }, threadId, type);
        }
        const target = parseInt(args[0]);
        if (isNaN(target) || target <= 0) {
            return api.sendMessage({ msg: "⚠️ Vui lòng nhập số lượng người hợp lệ. Ví dụ: /setnguoi 10", ttl: 300000 }, threadId, type);
        }
        data.target = target;
        data.dagui = []; // Reset current session
        await saveData(threadId, data);

        const groupName = await getGroupName();
        return api.sendMessage({ msg: `✅ Đã thiết lập giới hạn là: ${target} người.\nDanh sách đã gửi đã được reset.\n📂 Tên nhóm: ${groupName}\n🆔 ID nhóm: ${threadId}`, ttl: 300000 }, threadId, type);
    }

    // /start (Admin only)
    if (body.startsWith("/start")) {
        if (!isAdmin()) {
            return api.sendMessage({ msg: "⚠️ Bạn không có quyền sử dụng lệnh này.", ttl: 300000 }, threadId, type);
        }
        if (data.isRunning) {
            return api.sendMessage({ msg: "⚠️ Phiên điểm danh đang chạy rồi!", ttl: 300000 }, threadId, type);
        }
        data.isRunning = true;
        data.dagui = [];
        await saveData(threadId, data);
        return api.sendMessage({ msg: "🚀 Bắt đầu phiên điểm danh! Mọi người hãy gửi ảnh nhé.", ttl: 300000 }, threadId, type);
    }

    // /stop (Admin only)
    if (body.startsWith("/stop")) {
        if (!isAdmin()) {
            return api.sendMessage({ msg: "⚠️ Bạn không có quyền sử dụng lệnh này.", ttl: 300000 }, threadId, type);
        }
        if (!data.isRunning) {
            return api.sendMessage({ msg: "⚠️ Hiện không có phiên điểm danh nào đang chạy.", ttl: 300000 }, threadId, type);
        }

        const count = data.dagui.length;
        data.isRunning = false;
        data.dagui = [];
        await saveData(threadId, data);
        return api.sendMessage({ msg: `🛑 Đã kết thúc phiên điểm danh. Tổng cộng có ${count} người đã gửi.`, ttl: 300000 }, threadId, type);
    }

    // /clear history (Admin only)
    if (body.startsWith("/clear history")) {
        if (!isAdmin()) {
            return api.sendMessage({ msg: "⚠️ Bạn không có quyền sử dụng lệnh này.", ttl: 300000 }, threadId, type);
        }

        try {
            await global.database.clearHistory(threadId);
            return api.sendMessage({ msg: "✅ Đã xóa hoàn toàn lịch sử ghi nhận (history) trong database.", ttl: 300000 }, threadId, type);
        } catch (e) {
            console.error(e);
            return api.sendMessage({ msg: "⚠️ Lỗi khi xóa lịch sử.", ttl: 300000 }, threadId, type);
        }
    }

    // /check history <hours> (All users)
    if (body.startsWith("/check history")) {
        const hours = parseInt(args[1]);
        if (isNaN(hours) || hours <= 0) {
            return api.sendMessage({ msg: "⚠️ Vui lòng nhập số giờ hợp lệ. Ví dụ: /check history 24", ttl: 300000 }, threadId, type);
        }

        try {
            const now = Date.now();
            const startTime = now - (hours * 3600 * 1000);

            const history = await global.database.getHistory(threadId, startTime);

            if (history.length === 0) {
                return api.sendMessage({ msg: `📭 Trong ${hours} giờ qua, chưa có ai gửi ảnh.`, ttl: 300000 }, threadId, type);
            }

            const sentMap = {}; // uid -> { count, name }

            history.forEach(row => {
                const uid = row.sender_id;
                const count = row.count;
                const name = row.name;

                if (!sentMap[uid]) sentMap[uid] = { count: 0, name: name || "Người dùng" };
                sentMap[uid].count += count;
                if (name && name !== "Người dùng") sentMap[uid].name = name;
            });

            const sentUIDs = Object.keys(sentMap);
            const users = sentUIDs.map(uid => ({ name: sentMap[uid].name, count: sentMap[uid].count }));
            users.sort((a, b) => b.count - a.count);

            let msgReport = `📊 TỔNG HỢP LỊCH SỬ (${hours} GIỜ QUA)\n`;
            msgReport += `Tổng số người gửi: ${sentUIDs.length}\n\n`;
            msgReport += `Danh sách chi tiết:\n`;
            users.forEach((u, i) => {
                msgReport += `${i + 1}. ${u.name} (${u.count} ảnh)\n`;
            });

            return api.sendMessage({ msg: msgReport, ttl: 300000 }, threadId, type);

        } catch (e) {
            console.error(e);
            return api.sendMessage({ msg: "⚠️ Lỗi khi đọc dữ liệu lịch sử.", ttl: 300000 }, threadId, type);
        }
    }

    // /check
    if (body.startsWith("/check") && !body.startsWith("/checkdagui") && !body.startsWith("/checksosanh") && !body.startsWith("/cleardagui") && !body.startsWith("/clearsosanh")) {

        // Handle /check 2 <hours>
        if (args[0] === "2") {
            const hours = parseInt(args[1]);
            if (isNaN(hours) || hours <= 0) {
                return api.sendMessage({ msg: "⚠️ Vui lòng nhập số giờ hợp lệ. Ví dụ: /check 2 24", ttl: 300000 }, threadId, type);
            }

            try {
                const now = Date.now();
                const startTime = now - (hours * 3600 * 1000);

                const history = await global.database.getHistory(threadId, startTime);

                const sentMap = {}; // uid -> count
                history.forEach(row => {
                    const uid = row.sender_id;
                    const count = row.count;
                    if (!sentMap[uid]) sentMap[uid] = 0;
                    sentMap[uid] += count;
                });

                const sentUIDs = Object.keys(sentMap);
                const sosanh = data.sosanh || [];

                // Identify who sent and who didn't (based on sosanh list)
                const notSentList = sosanh.filter(u => !sentUIDs.includes(u.uid));

                let msgReport = `Trong số (${hours} giờ) có những thông tin sau:\n`;
                msgReport += `1: Tổng số người gửi (số người gửi là): ${sentUIDs.length}\n`;
                msgReport += `2: Số người chưa gửi là: ${notSentList.length} (Tổng chưa gửi)\n`;

                if (notSentList.length > 0) {
                    msgReport += `\nDanh sách chưa gửi:\n`;
                    const mentions = [];
                    notSentList.forEach((u, i) => {
                        msgReport += `${i + 1}. @${u.name}\n`;
                        mentions.push({
                            tag: `@${u.name}`,
                            id: u.uid,
                            fromIndex: msgReport.lastIndexOf(`@${u.name}`)
                        });
                    });
                    return api.sendMessage({ msg: msgReport, mentions: mentions }, threadId, type);
                } else {
                    msgReport += `\n🎉 Tất cả mọi người trong danh sách so sánh đã gửi ảnh!`;
                    return api.sendMessage({ msg: msgReport }, threadId, type);
                }

            } catch (e) {
                console.error(e);
                return api.sendMessage({ msg: "⚠️ Lỗi khi đọc dữ liệu lịch sử.", ttl: 300000 }, threadId, type);
            }
        }

        // Existing /check (default) logic
        const target = data.target || 0;
        const dagui = data.dagui || [];

        if (target === 0) {
            if (dagui.length === 0) {
                return api.sendMessage({ msg: "📭 Chưa có ai gửi ảnh trong phiên này.", ttl: 300000 }, threadId, type);
            }

            let msg = "📨 Danh sách người dùng đã gửi ảnh:\n";
            dagui.forEach((uid, i) => {
                const userInSosanh = data.sosanh.find(u => u.uid === uid);
                const name = userInSosanh ? userInSosanh.name : "Người dùng";
                msg += `${i + 1}. ${name} (${uid})\n`;
            });
            return api.sendMessage({ msg: msg, ttl: 300000 }, threadId, type);
        }

        // If target is set, show progress
        return api.sendMessage({ msg: `📊 Tiến độ: ${dagui.length}/${target} người đã gửi.`, ttl: 300000 }, threadId, type);
    }

    // /cleardagui (Admin only)
    if (body.startsWith("/cleardagui")) {
        if (!isAdmin()) {
            return api.sendMessage({ msg: "⚠️ Bạn không có quyền sử dụng lệnh này.", ttl: 300000 }, threadId, type);
        }
        data.dagui = [];
        await saveData(threadId, data);
        return api.sendMessage({ msg: "✅ Đã xóa toàn bộ danh sách đã gửi (dagui).", ttl: 300000 }, threadId, type);
    }

    // /clearsosanh (Admin only)
    if (body.startsWith("/clearsosanh")) {
        if (!isAdmin()) {
            return api.sendMessage({ msg: "⚠️ Bạn không có quyền sử dụng lệnh này.", ttl: 300000 }, threadId, type);
        }
        data.sosanh = [];
        await saveData(threadId, data);
        return api.sendMessage({ msg: "✅ Đã xóa toàn bộ danh sách so sánh (sosanh).", ttl: 300000 }, threadId, type);
    }
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadId, type } = event;
    const senderID = event.senderID || event.data?.uidFrom;

    // Check if message has images
    const msgType = event.data?.msgType;
    const hasImage = (event.attachments && event.attachments.some(att =>
        att.type === "photo" || att.type === "image" || (att.url && att.url.includes(".jpg")) || (att.url && att.url.includes(".png"))
    )) || (msgType === "chat.photo");

    if (!hasImage) return;

    // Load data for this specific thread
    let data = await loadData(threadId);

    // Check if session is running
    if (!data.isRunning) return;

    // Get user name first
    let name = "Bạn";
    try {
        const info = await api.getUserInfo(senderID);
        if (info && info.changed_profiles && info.changed_profiles[senderID]) {
            name = info.changed_profiles[senderID].displayName || name;
        } else if (info && info[senderID]) {
            name = info[senderID].name || info[senderID].displayName || name;
        }
    } catch (e) {
        // Ignore error
    }

    // Check if user already submitted
    if (data.dagui.includes(senderID)) {
        // User already submitted, send warning with mention
        const msg = `⚠️ @${name} đã gửi ảnh rồi!`;
        return api.sendMessage({
            msg: msg,
            mentions: [{ pos: 4, uid: senderID, len: name.length + 1 }],
            ttl: 300000
        }, threadId, type);
    }

    // Add to dagui (first time submission)
    data.dagui.push(senderID);
    await saveData(threadId, data);

    // Send confirmation message with user mention (no UID)
    const confirmMsg = `✅ Cảm ơn @${name} đã gửi ảnh thành công!`;
    api.sendMessage({
        msg: confirmMsg,
        mentions: [{ pos: 12, uid: senderID, len: name.length + 1 }],
        ttl: 300000
    }, threadId, type);

    // Check if target reached
    const currentCount = data.dagui.length;
    const target = data.target;

    if (target > 0 && currentCount >= target) {
        // Use @All mention for completion message
        const completeMsg = `🎉 @All ĐÃ XONG! Đã đủ ${target} người gửi ảnh!\n📊 Tổng quan:\n- Tổng cần: ${target}\n- Đã gửi: ${currentCount}`;
        api.sendMessage({
            msg: completeMsg,
            mentions: [{ pos: 4, uid: "0", len: 4 }],
            ttl: 300000
        }, threadId, type);
    }
};
