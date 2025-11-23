const { getData, saveData, db } = require('../../utils/db');
const logger = require('../../utils/logger');

module.exports = {
  getAll: () => {
    const rows = db.prepare('SELECT * FROM Users').all();
    return rows.map(row => ({
      userId: row.userId,
      data: JSON.parse(row.data || '{}')
    }));
  },

  getData: (userId) => {
    const existing = db.prepare('SELECT 1 FROM Users WHERE userId = ?').get(userId);
    if (!existing) {
      module.exports.createData(userId, { ban: false, money: global.config.default_money });
      logger.log("Đã tạo database cho người dùng: " + userId, "info");
    }
    return getData('Users', 'userId', userId);
  },

  setData: (userId, data) => {
    saveData('Users', 'userId', userId, data);
  },

  delData: (userId) => {
    const exists = db.prepare('SELECT 1 FROM Users WHERE userId = ?').get(userId);
    if (exists) {
      db.prepare('DELETE FROM Users WHERE userId = ?').run(userId);
    }
  },

  createData: (userId, defaultData = {}) => {
    const existing = db.prepare('SELECT 1 FROM Users WHERE userId = ?').get(userId);
    if (!existing) {
      saveData('Users', 'userId', userId, defaultData);
    }
  }
};
