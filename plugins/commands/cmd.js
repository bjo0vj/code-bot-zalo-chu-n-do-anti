const path = require("path");
const fs = require("fs");
const loaderCommand = require("../../core/loader/loaderCommand");

module.exports.config = {
    name: "command",
    aliases: ["cmd"],
    version: "1.2.0",
    role: 2,
    author: "TDF-2803",
    description: "Quản lý và kiểm soát các plugin lệnh của bot.",
    category: "Hệ thống",
    usage: ".cmd <load|unload|loadall|unloadall|list|info> [tên lệnh]",
    cooldowns: 2
};

async function loadModule(api, event, moduleName) {
    const { threadId, type } = event;
    const commandPath = path.join(__dirname, `${moduleName}.js`);
    if (!fs.existsSync(commandPath)) {
        return api.sendMessage(`Không tìm thấy plugin '${moduleName}'.`, threadId, type);
    }

    delete require.cache[require.resolve(commandPath)];
    const load = await loaderCommand(moduleName);

    if (load.status === false) {
        return api.sendMessage(`❌ Lỗi khi tải lệnh '${moduleName}': ${load.error}`, threadId, type);
    }

    if (load.restart) {
        await api.sendMessage(`🔄 Đã cài đặt thêm package. Tiến hành khởi động lại bot để áp dụng thay đổi.`, threadId, type);
        return process.exit(2);
    }

    return api.sendMessage(`✅ Đã tải lệnh '${moduleName}' thành công.`, threadId, type);

}

async function unloadModule(api, event, moduleName) {
    const { threadId, type } = event;
    if (!global.client.commands.has(moduleName)) {
        return api.sendMessage(`Lệnh '${moduleName}' chưa được tải.`, threadId, type);
    }
    global.client.commands.delete(moduleName);
    const commandPath = path.join(__dirname, `${moduleName}.js`);
    delete require.cache[require.resolve(commandPath)];
    return api.sendMessage(`✅ Đã gỡ thành công lệnh '${moduleName}'.`, threadId, type);
}

module.exports.run = async function ({ api, event, args }) {
    const { threadId, type } = event;

    if (!global.users.admin.includes(event.data.uidFrom)) {
        return api.sendMessage("Bạn không có quyền sử dụng lệnh này.", threadId, type);
    }

    const action = args[0]?.toLowerCase();
    const moduleName = args[1];

    switch (action) {
        case "load":
            if (!moduleName) return api.sendMessage("Vui lòng nhập tên lệnh cần tải.", threadId, type);
            await loadModule(api, event, moduleName);
            break;

        case "unload":
            if (!moduleName) return api.sendMessage("Vui lòng nhập tên lệnh cần gỡ.", threadId, type);
            await unloadModule(api, event, moduleName);
            break;

        case "loadall":
            try {
                await api.sendMessage("🔄 Bắt đầu tải lại tất cả lệnh...", threadId, type);
                Object.keys(require.cache).forEach(key => {
                    if (key.startsWith(__dirname)) delete require.cache[key];
                });
                global.client.commands.clear();
                const loaderCommand = require("../../core/loader/loaderCommand");
                await loaderCommand();
                await api.sendMessage(`✅ Đã tải lại thành công ${global.client.commands.size} lệnh.`, threadId, type);
            } catch (error) {
                console.error("Lỗi khi loadall:", error);
                await api.sendMessage(`❌ Lỗi khi tải lại lệnh:\n${error.message}`, threadId, type);
            }
            break;

        case "unloadall":
            try {
                const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".js") && f !== "cmd.js");
                let count = 0;
                for (const file of files) {
                    const name = file.replace(".js", "");
                    if (global.client.commands.has(name)) {
                        global.client.commands.delete(name);
                        delete require.cache[require.resolve(path.join(__dirname, file))];
                        count++;
                    }
                }
                await api.sendMessage(`✅ Đã gỡ ${count} lệnh thành công.`, threadId, type);
            } catch (error) {
                console.error("Lỗi khi gỡ:", error);
                await api.sendMessage(`❌ Lỗi khi gỡ lệnh:\n${error.message}`, threadId, type);
            }
            break;

        case "list":
            const list = Array.from(global.client.commands.keys());
            api.sendMessage(`📦 Hiện có ${list.length} lệnh đang hoạt động:\n${list.join(", ")}`, threadId, type);
            break;

        case "info":
            if (!moduleName) return api.sendMessage("Vui lòng nhập tên lệnh cần xem thông tin.", threadId, type);
            const cmd = global.client.commands.get(moduleName);
            if (!cmd) return api.sendMessage(`Lệnh '${moduleName}' chưa được tải hoặc không tồn tại.`, threadId, type);
            const config = cmd.config;
            const roleText = config.role === 0 ? "Người dùng" : config.role === 1 ? "Support" : "Admin";
            const depsText = config.dependencies ? Object.keys(config.dependencies).join(", ") : "Không có";

            const msg = `🔎 Thông tin lệnh: ${config.name}\n\n` +
                `- Mô tả: ${config.description}\n` +
                `- Tác giả: ${config.author}\n` +
                `- Phiên bản: ${config.version}\n` +
                `- Quyền hạn: ${roleText}\n` +
                `- Cách dùng: ${config.usage}\n` +
                `- Dependencies: ${depsText}`;
            api.sendMessage(msg, threadId, type);
            break;

        default:
            api.sendMessage(
                "📚 Quản lý module bot\n\n" +
                "cmd load <lệnh> - Tải một lệnh\n" +
                "cmd unload <lệnh> - Gỡ một lệnh\n" +
                "cmd loadall - Tải lại tất cả lệnh\n" +
                "cmd unloadall - Gỡ tất cả lệnh\n" +
                "cmd list - Liệt kê các lệnh\n" +
                "cmd info <lệnh> - Xem thông tin lệnh",
                threadId, type
            );
            break;
    }
};
