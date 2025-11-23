const chalk = require("chalk");
const moment = require("moment-timezone");

module.exports.config = {
    event_type: ["message"],
    name: "log",
    version: "1.0.1",
    author: "TDF-2803",
    description: "Log tin nhắn lên console",
    dependencies: {
        "moment-timezone": "",
        "chalk": ""
    }
};

module.exports.run = async function({ api, event }) {
    const { threadId, data, type } = event;
    const time = moment.tz("Asia/Ho_Chi_Minh").format("D/MM/YYYY HH:mm:ss");

    const senderName = data.dName || "Không rõ";
    let content;

    if (typeof data.content === "string") {
        content = data.content;
    } else if (typeof data.content?.title === "string") {
        content = data.content.title;
    } else {
        content = "[Không phải tin nhắn văn bản]";
    }

    let message;

    if (type == 0) {
        message = chalk.yellow(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 Tin nhắn riêng từ: ${senderName}
 Người dùng: ${senderName}
 Nội dung: ${content}
 Thời gian: ${time}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    } else {
        let groupName;
        try {
            const groupInfo = await api.getGroupInfo(threadId);
            groupName = groupInfo?.gridInfoMap?.[threadId]?.name || "Tên nhóm không xác định";
        } catch {
            groupName = "Không lấy được tên nhóm";
        }

        message = chalk.green(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
 Nhóm: ${groupName}
 Người dùng: ${senderName}
 Nội dung: ${content}
 Thời gian: ${time}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`);
    }

    console.log(message);
};
