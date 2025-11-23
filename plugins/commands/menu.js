const moment = require("moment-timezone");

module.exports.config = {
    name: "menu",
    aliases: ['help', 'menufull', 'menuad'],
    version: "2.1.1",
    role: 0,
    author: "TDF-2803",
    description: "Xem danh sách lệnh",
    category: "Tiện ích",
    usage: "/menu, /menufull, /menuad",
    cooldowns: 2
};

function getDayVN() {
    const days = {
        'Sunday': 'Chủ Nhật',
        'Monday': 'Thứ Hai',
        'Tuesday': 'Thứ Ba',
        'Wednesday': 'Thứ Tư',
        'Thursday': 'Thứ Năm',
        'Friday': 'Thứ Sáu',
        'Saturday': 'Thứ Bảy'
    };
    const thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
    return days[thu] || thu;
}

module.exports.run = async function ({ api, event, args, Threads }) {
    const { threadId, type, data } = event;
    const senderId = data.uidFrom;
    const body = event.body || event.data?.content || "";
    const config = global.config;
    const admin = Array.isArray(config.admin_bot) ? config.admin_bot : [];
    const isAdmin = admin.includes(senderId);

    // Check command type
    const isMenuFull = body.toLowerCase().includes("menufull");
    const isMenuAd = body.toLowerCase().includes("menuad");

    let msg = "";



    if (isMenuAd) {
        if (!isAdmin) return api.sendMessage("🚫 Bạn không có quyền xem menu admin.", threadId, type);

        msg += "━━━━━ 🛠️ MENU ADMIN ━━━━━\n\n";
        msg += "1. /make file sendall - Tạo data sendall\n";
        msg += "2. /autosend on/off - Bật/tắt gửi tự động\n";
        msg += "3. /record history on/off - Bật/tắt ghi lịch sử\n";
        msg += "4. /setnguoi <số> - Đặt số lượng người\n";
        msg += "5. /start - Bắt đầu điểm danh\n";
        msg += "6. /stop - Dừng điểm danh\n";
        msg += "7. /check history <giờ> - Xem lịch sử\n";
        msg += "8. /cleardagui - Xóa danh sách đã gửi\n";
        msg += "9. /clearsosanh - Xóa danh sách so sánh\n";
        msg += "10. /cleardata - Xóa cache hệ thống\n";
        msg += "11. /add data_sendall:@tag - Thêm vào sendall\n";
        msg += "12. /remove data_sendall:@tag - Xóa khỏi sendall\n";
        msg += "13. /delete file sendall - Xóa data sendall\n";
        msg += "14. /mute <uid> <phút> - Cấm chat\n";
        msg += "15. /unmute <uid> - Bỏ cấm chat\n";
        msg += "16. /antiuse <uid> - Cấm dùng bot\n";
        msg += "17. /accpectuse <uid> - Mở cấm dùng bot\n";
        msg += "18. /admin - Quản lý Admin/Support\n";

        return api.sendMessage({ msg: msg, ttl: 120000 }, threadId, type);
    }

    if (isMenuFull) {
        // Show all commands grouped by category
        const cmds = global.client.commands;
        const commandsArray = Array.from(cmds.values()).map(cmd => cmd.config);
        const grouped = [];

        commandsArray.forEach(cmd => {
            // Filter out admin commands if not admin
            if (cmd.role > 0 && !isAdmin) return;

            const { category, name, description } = cmd;
            let group = grouped.find(g => g.cmdCategory === category);
            if (!group) {
                grouped.push({ cmdCategory: category, commands: [{ name, description }] });
            } else {
                group.commands.push({ name, description });
            }
        });

        // Sort categories by number of commands
        grouped.sort((a, b) => b.commands.length - a.commands.length);

        msg += "📋 DANH SÁCH TẤT CẢ LỆNH\n\n";

        grouped.forEach(group => {
            msg += `╭─── [ ${group.cmdCategory ? group.cmdCategory.toUpperCase() : "KHÁC"} ] ───╮\n`;
            group.commands.forEach((cmd, index) => {
                msg += `${index + 1}. ${cmd.name} : ${cmd.description}\n`;
            });
            msg += `╰───────────────╯\n\n`;
        });

        const cmds_size = global.client.commands.size;
        msg += `📝 Tổng số lệnh: ${cmds_size} lệnh\n`;
        msg += `⏰ Hôm nay là: ${getDayVN()}\n`;
        msg += `⏱️ Thời gian: ${moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY")}`;

        return api.sendMessage({ msg: msg, ttl: 120000 }, threadId, type);
    }

    // Default /menu - Show main commands only (User commands)
    msg += "━━━━━ 📋 MENU LỆNH ━━━━━\n\n";

    msg += "╭───[ LỆNH CƠ BẢN ]───╮\n";
    msg += "1. /checkautosend - Xem lịch tự động gửi\n";
    msg += "2. /addten - Thêm tên vào danh sách\n";
    msg += "3. /check - Xem trạng thái tracking\n";
    msg += "4. /rank - Xem bảng xếp hạng\n";
    msg += "5. /getid @tên - Lấy UID người dùng\n";
    msg += "6. /menu - Xem menu này\n";
    msg += "7. /menufull - Xem tất cả lệnh\n";
    msg += "8. /list data_sendall - Xem DS SendAll\n";
    msg += "9. /add data_sendall - Tự thêm vào DS\n";
    msg += "10. /remove data_sendall - Tự xóa khỏi DS\n";
    msg += "11. /check 2 <giờ> - Kiểm tra & tổng hợp\n";
    msg += "12. /check history <giờ> - Xem lịch sử\n";
    msg += "╰─────────────────╯\n\n";

    msg += `👤 ${isAdmin ? "⭐ Admin" : "👥 Thành viên"} | `;
    msg += `📅 ${getDayVN()} | `;
    msg += `🕐 ${moment.tz("Asia/Ho_Chi_Minh").format("HH:mm")}`;

    return api.sendMessage({ msg: msg, ttl: 120000 }, threadId, type);
};
