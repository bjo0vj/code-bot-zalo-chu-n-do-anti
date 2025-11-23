const Database = require("@replit/database");
const db = new Database();

// Lưu cache
exports.saveCache = async (key, value) => {
  await db.set(key, value);
};

// Lấy cache
exports.loadCache = async (key) => {
  return await db.get(key) || {};
};

// Lưu lịch sử tin nhắn (append)
exports.appendMessage = async (userId, message) => {
  let history = await db.get(`history_${userId}`) || [];
  history.push({ message, time: Date.now() });
  await db.set(`history_${userId}`, history);
};
