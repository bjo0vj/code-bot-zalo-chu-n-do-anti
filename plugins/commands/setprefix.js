module.exports.config = {
    name: "setprefix",
    version: "1.0.0",
    role: 1,
    author: "TDF-2803",
    description: "Đặt lại prefix của nhóm",
    category: "Nhóm",
    usage: "[prefix/reset]",
    cooldowns: 2,
};

module.exports.handleEvent = async function({ api, event, Threads }) {
    const { threadId, type } = event;
    try {
        const { prefix } = global.config;

        var threadSetting = (await Threads.getData(event.threadId)).data || {};

        let prefixThread = threadSetting.prefix || prefix;

        const lowerBody = event.data.content.toLowerCase();

        if (
            lowerBody === "prefix" ||
            lowerBody === "prefix bot là gì" ||
            lowerBody === "quên prefix r" ||
            lowerBody === "dùng sao"
        ) {
            api.sendMessage(
            { msg: `✏️ Prefix của nhóm: ${prefixThread}\n📎 Prefix hệ thống: ${prefix}`, ttl: 15000},
            threadId,
            type
            );
        }
    } catch (e) {
    }
};

module.exports.run = async ({ api, event, args, Threads }) => {
    if (typeof args[0] === "undefined") return api.sendMessage(`⚠️ Vui lòng nhập prefix mới để thay đổi prefix của nhóm`, event.threadId, event.type);
    const prefix = args[0].trim();
    if (!prefix) return api.sendMessage(`⚠️ Vui lòng nhập prefix mới để thay đổi prefix của nhóm`, event.threadId, event.type);
    if (prefix === "reset") {
        var data = (await Threads.getData(event.threadId)).data || {};
        data.prefix = global.config.prefix;
        await Threads.setData(event.threadId, data);
        return api.sendMessage(`☑️ Đã reset prefix về mặc định: ${global.config.prefix}`, event.threadId, event.type);
    } else {
        var data = (await Threads.getData(String(event.threadId))).data || {};
        data.prefix = prefix;
        await Threads.setData(event.threadId, data);
        return api.sendMessage(`☑️ Đã thay đổi prefix của nhóm thành: ${prefix}`, event.threadId, event.type);
    }
};
