module.exports.config = {
  name: 'sendcard',
  version: '1.0.0',
  role: 0,
  author: "TDF-2803",
  description: 'Gửi danh thiếp của người được tag',
  category: 'Tiện ích',
  usage: 'sendcard @user [nội dung tuỳ chọn]',
  cooldowns: 3,
  aliases: []
};

function escapeRegExp(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports.run = async ({ args, event, api }) => {
  const { threadId, type, data } = event;

  const mentions = data.mentions;
  const hasMention = mentions && mentions.length > 0;

  if (!hasMention) {
    return api.sendMessage(
      "❌ Bạn cần tag 1 người để gửi danh thiếp.\nDùng: sc @user [nội dung tuỳ chọn]",
      threadId,
      type
    );
  }

  let optionalText = args.join(" ").trim();
  const removeOnce = (str, pattern) => {
    const re = new RegExp(`(^|\\s)${pattern}(?=\\s|$)`, "i");
    return str.replace(re, (m, p1) => p1 ? p1 : "").replace(/\s{2,}/g, " ").trim();
  };

  try {
    const nameCache = {};
    for (const m of mentions) {
      try {
        const info = await api.getUserInfo(m.uid);
        nameCache[m.uid] = info?.changed_profiles?.[m.uid]?.displayName || "";
      } catch { nameCache[m.uid] = ""; }
    }

    let cleanedText = optionalText;
    for (const uid in nameCache) {
      const displayName = nameCache[uid];
      if (displayName) {
        const escaped = escapeRegExp(`@${displayName}`);
        cleanedText = removeOnce(cleanedText, escaped);
      }
    }
    cleanedText = cleanedText.replace(/@[\S]+/g, "").replace(/\s{2,}/g, " ").trim();

    for (const m of mentions) {
      const targetId = m.uid;

      const payload = { userId: targetId };
      if (cleanedText.length > 0) {
        payload.phoneNumber = cleanedText;
      }

      await api.sendCard(payload, threadId, type);

    }
  } catch (err) {
    console.error("[sc] sendCard error:", err);
    return api.sendMessage("❌ Không gửi được danh thiếp. Vui lòng thử lại!", threadId, type);
  }
}
