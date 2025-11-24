const fs = require("fs-extra");
const path = require("path");
const { getMessageCache } = require("../../utils/index");

module.exports.config = {
    name: "delete",
    version: "1.1.0",
    role: 1, // Admin group or Bot Admin
    author: "TDF-2803",
    description: "Xóa dữ liệu hoặc tin nhắn",
    category: "Hệ thống",
    usage: "/delete <file sendall | all chat all mem>",
    cooldowns: 5
};

async function isGroupAdmin(api, userId, threadId) {
    try {
        const info = await api.getGroupInfo(threadId);
        const groupInfo = info.gridInfoMap[threadId];

        const isCreator = groupInfo.creatorId === userId;
        const isDeputy = Array.isArray(groupInfo.adminIds) && groupInfo.adminIds.includes(userId);

        return isCreator || isDeputy;
    } catch (e) {
        return false;
    }
}

module.exports.run = async function ({ api, event, args }) {
    const { threadId, type } = event;
    const senderID = event.senderID || event.data?.uidFrom;
    const command = args.join(" ");

    // === CASE 1: DELETE FILE SENDALL ===
    if (args[0] === "file" && args[1] === "sendall") {
        const filePath = path.join(__dirname, "../../data/data_sendall", `${threadId}.json`);

        if (!fs.existsSync(filePath)) {
            return api.sendMessage("❌ Nhóm này chưa tạo database sendall.", threadId, type);
        }

        try {
            fs.unlinkSync(filePath);
            return api.sendMessage("✅ Đã xóa file database sendall của nhóm thành công.", threadId, type);
        } catch (error) {
            console.error(error);
            return api.sendMessage("❌ Đã xảy ra lỗi khi xóa file database.", threadId, type);
        }
    }

    // === CASE 2: DELETE ALL CHAT ALL MEM ===
    if (command.startsWith("all chat all mem")) {
        // 1. Check Bot Admin
        const config = global.config;
        const botAdmins = Array.isArray(config.admin_bot) ? config.admin_bot : [];
        if (!botAdmins.includes(senderID)) {
            return api.sendMessage("⚠️ Bạn không phải là Admin Bot!", threadId, type);
        }

        // 2. Check Group Admin
        const isAdmin = await isGroupAdmin(api, senderID, threadId);
        if (!isAdmin) {
            return api.sendMessage("⚠️ Bạn cần là Quản trị viên của nhóm để dùng lệnh này!", threadId, type);
        }



        // 4. Execute Delete
        const messageCache = getMessageCache();
        const threadMessages = Object.values(messageCache).filter(msg => msg.threadId === threadId);

        if (threadMessages.length === 0) {
            return api.sendMessage("✅ Không tìm thấy tin nhắn nào trong cache để xóa.", threadId, type);
        }

        api.sendMessage(`⏳ Đang tiến hành xóa ${threadMessages.length} tin nhắn...`, threadId, type);

        let deletedCount = 0;
        let errorCount = 0;
        let firstError = null;

        for (const msg of threadMessages) {
            try {
                await api.deleteMessage({
                    threadId,
                    type,
                    data: {
                        cliMsgId: msg.cliMsgId,
                        msgId: msg.msgId,
                        uidFrom: msg.uidFrom
                    }
                }, false);
                deletedCount++;
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                // Check if error is "use undo api instead"
                const isUndoError = error.toString().includes("use undo api instead") || (error.message && error.message.includes("use undo api instead"));

                if (isUndoError) {
                    try {
                        if (typeof api.undo === 'function') {
                            await api.undo({
                                msgId: msg.msgId,
                                cliMsgId: msg.cliMsgId
                            }, threadId, type);

                            deletedCount++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                            continue;
                        } else {
                            console.error("api.undo is not a function");
                            errorCount++;
                            if (!firstError) firstError = new Error("api.undo is not a function");
                        }
                    } catch (undoError) {
                        errorCount++;
                        if (!firstError) firstError = undoError;
                        console.error("Undo error:", undoError);
                    }
                } else {
                    errorCount++;
                    if (!firstError) firstError = error;
                    console.error("Delete error:", error);
                }
            }
        }

        let msgReply = `✅ Đã hoàn tất!\n🗑️ Đã xóa: ${deletedCount} tin nhắn\n❌ Lỗi: ${errorCount} tin nhắn`;
        if (firstError) {
            msgReply += `\n\n⚠️ Lỗi đầu tiên: ${firstError.message || firstError}`;
        }

        return api.sendMessage(msgReply, threadId, type);
    }

    // Default usage message
    return api.sendMessage(
        "❌ Cú pháp không đúng.\n" +
        "👉 Xóa data sendall: /delete file sendall\n" +
        "👉 Xóa toàn bộ tin nhắn: /delete all chat all mem",
        threadId,
        type
    );
};
