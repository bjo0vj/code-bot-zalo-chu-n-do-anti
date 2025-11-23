const { convertTimestamp, getMessageCache } = require("../../utils/index");
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");
const { ThreadType } = require("zca-js");

module.exports.config = {
  name: "anti",
  version: "1.1.7",
  role: 1,
  author: "TDF-2803",
  description: "Bật/tắt các chế độ Anti của nhóm",
  category: "Nhóm",
  usage: "anti <link|undo|spam>",
  cooldowns: 2
};

const baseUndoMsg = `👤 {name} đã thu hồi tin nhắn sau...\n` +
  `⏰ Thời gian gửi: {time_send}\n` +
  `🔔 Thời gian thu hồi: {time_undo}\n` +
  `📝 Nội Dung: {content}`;

function formatUndoMessage(name, timeSend, timeUndo, content) {
  return baseUndoMsg
    .replace('{name}', name)
    .replace('{time_send}', convertTimestamp(timeSend))
    .replace('{time_undo}', convertTimestamp(timeUndo))
    .replace('{content}', content || "");
}

async function handlePhoto(messageCache, tempPath, name, timeSend, timeUndo, threadId, api, type) {
  const tempFilePath = path.join(tempPath, `anti_undo_${Date.now()}.jpg`);
  const response = await axios.get(messageCache.content.href, { responseType: 'arraybuffer' });

  await fs.mkdir(tempPath, { recursive: true });
  await fs.writeFile(tempFilePath, response.data);

  const message = messageCache.content.title || "";
  const msgBody = formatUndoMessage(name, timeSend, timeUndo, message);

  await api.sendMessage({ msg: msgBody, attachments: [tempFilePath] }, threadId, type);
  return tempFilePath;
}

async function isAdmin(api, userId, threadId) {
  const info = await api.getGroupInfo(threadId);
  const groupInfo = info.gridInfoMap[threadId];

  const isCreator = groupInfo.creatorId === userId;
  const isDeputy = Array.isArray(groupInfo.adminIds) && groupInfo.adminIds.includes(userId);
  isGroupAdmin = isCreator || isDeputy;

  return isGroupAdmin;
}


module.exports.handleEvent = async function ({ event, api, Threads, eventType }) {
  const { threadId, isGroup, data, type } = event;
  const typeUndo = isGroup ? 1 : 0;
  const userId = data.uidFrom;
  const name = data.dName || "Bạn";

  const threadData = (await Threads.getData(threadId)).data || {};
  const tempPath = path.join(__dirname, "temp");
  const tempFiles = [];

  try {
    // === Anti Link ===
    if (threadData.anti_link) {
      if ((data.msgType == "chat.recommended" && data.content.action == "recommened.link") || (data.msgType == "webchat" && String(data.content).match(/https?:\/\/[^\s]+/))) {
        if (isAdmin(api, userId, threadId)) return;
        await api.deleteMessage({
          threadId,
          type,
          data: {
            cliMsgId: data.cliMsgId,
            msgId: data.msgId,
            uidFrom: userId
          }
        }, false);

        const msg = `🚫 @${name}, không được gửi link trong nhóm này!`;
        return api.sendMessage({
          msg,
          mentions: [{ pos: 3, uid: userId, len: name.length + 1 }],
          ttl: 15000
        }, threadId, type);
      }
    }

    // === Anti Spam ===
    const SPAM_LIMIT = 5;
    const SPAM_TIME = 5000;
    const now = Date.now();

    global.spamCache = global.spamCache || {};
    const spamCache = global.spamCache;

    if (threadData.anti_spam) {
      if (!spamCache[threadId]) spamCache[threadId] = {};
      if (!spamCache[threadId][userId]) spamCache[threadId][userId] = [];

      if (isAdmin(api, userId, threadId)) return;

      spamCache[threadId][userId].push(now);
      spamCache[threadId][userId] = spamCache[threadId][userId].filter(ts => now - ts <= SPAM_TIME);

      if (spamCache[threadId][userId].length > SPAM_LIMIT) {
        await api.deleteMessage({
          threadId,
          type,
          data: {
            cliMsgId: data.cliMsgId,
            msgId: data.msgId,
            uidFrom: userId
          }
        }, false);

        const msg = `🚫 @${name}, vui lòng không spam!`;
        return api.sendMessage({
          msg,
          mentions: [{ pos: 3, uid: userId, len: name.length + 1 }],
          ttl: 15000
        }, threadId, type);
      }
    }

    // === Anti Undo ===
    if (threadData.anti_undo && eventType === "undo") {
      const messageCache = getMessageCache()[data.content.cliMsgId];
      if (!messageCache) return;

      const timeSend = messageCache.timestamp;
      const timeUndo = data.ts;

      const sendUndoMessage = async (msg, extra) => {
        await api.sendMessage({ msg, ...(extra || {}) }, threadId, typeUndo);
      };

      switch (messageCache.msgType) {
        case "chat.photo": {
          const filePath = await handlePhoto(messageCache, tempPath, name, timeSend, timeUndo, threadId, api, typeUndo);
          tempFiles.push(filePath);
          break;
        }

        case "chat.video.msg": {
          const { href: videoUrl, thumb: thumbnailUrl, params } = messageCache.content;
          const { duration, video_width: width, video_height: height } = JSON.parse(params);

          await sendUndoMessage(formatUndoMessage(name, timeSend, timeUndo));
          await api.sendVideo({ videoUrl, thumbnailUrl, duration, height, width }, threadId, typeUndo);
          break;
        }

        case "chat.sticker": {
          const { id, catId, type: stickerType } = messageCache.content;

          await sendUndoMessage(formatUndoMessage(name, timeSend, timeUndo));
          await api.sendSticker({ id, cateId: catId, type: stickerType }, threadId, typeUndo);
          break;
        }

        case "chat.voice": {
          const { href: voiceUrl } = messageCache.content;

          await sendUndoMessage(formatUndoMessage(name, timeSend, timeUndo));
          await api.sendVoice({ voiceUrl }, threadId, typeUndo);
          break;
        }

        case "chat.recommended": {
          const { action, href, title, params } = messageCache.content;

          if (action === "recommened.link") {
            const msg = formatUndoMessage(name, timeSend, timeUndo, title.replace(href, ""));
            await api.sendLink({ msg, link: href }, threadId, typeUndo);
          } else if (action === "recommened.user") {
            await sendUndoMessage(formatUndoMessage(name, timeSend, timeUndo));
            await api.sendCard({ userId: params }, threadId, typeUndo);
          }
          break;
        }

        case "chat.gif":
        case "share.file": {
          const fileUrl = messageCache.content?.href;
          if (!fileUrl) break;

          try {
            const response = await axios.get(fileUrl, { responseType: "arraybuffer" });

            let fileName = `anti_undo_${Date.now()}.dat`;

            const disposition = response.headers["content-disposition"];
            if (disposition && disposition.includes("filename=")) {
              const match = disposition.match(/filename="?([^"]+)"?/);
              if (match && match[1]) {
                fileName = `${Date.now()}_${match[1]}`;
              }
            }

            const tempFilePath = path.join(tempPath, fileName);
            await fs.writeFile(tempFilePath, response.data);

            const msgBody = formatUndoMessage(name, timeSend, timeUndo, messageCache.content.title || "");

            await api.sendMessage({
              msg: msgBody,
              attachments: [tempFilePath]
            }, threadId, typeUndo);

            tempFiles.push(tempFilePath);
          } catch (err) {
            console.error("[share.file] Download failed:", err.message);
          }
          break;
        }

        case "webchat": {
          await sendUndoMessage(formatUndoMessage(name, timeSend, timeUndo, messageCache.content));
          break;
        }
      }
    }
  } catch (err) {
    console.error("Lỗi khi xử lý anti:", err);
  } finally {
    for (const file of tempFiles) {
      try {
        await fs.unlink(file);
      } catch (err) {
        console.error(`Không thể xóa file tạm ${file}:`, err);
      }
    }
  }
};

module.exports.run = async function ({ api, event, args, Threads }) {
  const { threadId, type } = event;
  const action = (args[0] || "").toLowerCase();

  if (type !== ThreadType.Group) {
      return api.sendMessage("Lệnh này chỉ có thể được sử dụng trong nhóm chat.", threadId, type);
  }

  const keyMap = {
    link: "anti_link",
    undo: "anti_undo",
    spam: "anti_spam"
  };

  const key = keyMap[action];

  if (!key) {
    return api.sendMessage(
      "🛡️ Quản lý chế độ Anti của nhóm\n\n" +
      "• anti undo - Chống thu hồi tin nhắn\n" +
      "• anti link - Chống gửi link\n" +
      "• anti spam - Chống spam tin nhắn\n",
      threadId,
      type
    );
  }

  const threadData = await Threads.getData(threadId);
  const currentValue = threadData.data[key] || false;
  const newValue = !currentValue;

  threadData.data[key] = newValue;
  await Threads.setData(threadId, threadData.data);

  return api.sendMessage(
    `✅ Đã ${newValue ? "bật" : "tắt"} chế độ Anti ${key.replace("anti_", "").toUpperCase()}.`,
    threadId,
    type
  );
};
