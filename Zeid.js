const fs = require("fs");
const path = require("path");
const YAML = require("yaml");
const login = require("./core/login");
const logger = require("./utils/logger");
const listener = require("./core/listen");
const loaderCommand = require("./core/loader/loaderCommand");
const loaderEvent = require("./core/loader/loaderEvent");
const schedule = require("node-schedule");
const { cleanOldMessages } = require("./utils/index");
require('./server.js'); // Keep-alive for Replit

global.client = new Object({
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map()
});

global.users = {
  admin: [],
  support: []
};

global.config = new Object();

global.api = null;

(async () => {

  try {
    const configPath = path.join(__dirname, "config.yml");
    const fileContent = fs.readFileSync(configPath, "utf8");
    const config = YAML.parse(fileContent);

    global.config = config;
    global.users = {
      admin: Array.isArray(config.admin_bot) ? config.admin_bot.map(String) : [],
      support: Array.isArray(config.support_bot) ? config.support_bot.map(String) : []
    };

    // Initialize bot state
    const botStateFile = path.join(__dirname, "data", "bot_state.json");
    try {
      if (fs.existsSync(botStateFile)) {
        global.botState = JSON.parse(fs.readFileSync(botStateFile, "utf8"));
      } else {
        global.botState = { suspended: false };
      }
    } catch (e) {
      global.botState = { suspended: false };
    }

    logger.log("Đã tải cấu hình từ config.yml thành công", "info");
  } catch (error) {
    logger.log(`Lỗi khi đọc config.yml: ${error.message || error}`, "error");
    process.exit(1);
  }

  const tempFolderCommand = path.join(__dirname, "plugins", "commands", "temp");
  const tempFolderEvent = path.join(__dirname, "plugins", "events", "temp");

  try {
    if (fs.existsSync(tempFolderCommand)) {
      fs.rmSync(tempFolderCommand, { recursive: true, force: true });
      logger.log("Đã dọn dẹp folder temp của commands", "info");
    }
    if (fs.existsSync(tempFolderEvent)) {
      fs.rmSync(tempFolderEvent, { recursive: true, force: true });
      logger.log("Đã dọn dẹp folder temp của events", "info");
    }
  } catch (error) {
    logger.log(`Lỗi khi dọn folder temp: ${error.message || error}`, "error");
  }

  logger.log("\n┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓");
  for (let i = 0; i <= global.users.admin.length - 1; i++) {
    dem = i + 1;
    logger.log(` ID ADMIN ${dem}: ${!global.users.admin[i] ? "Trống" : global.users.admin[i]}`);
  }
  for (let i = 0; i <= global.users.support.length - 1; i++) {
    dem = i + 1;
    logger.log(` ID SUPPORT ${dem}: ${!global.users.support[i] ? "Trống" : global.users.support[i]}`);
  }
  logger.log(` NAME BOT: ${global.config.name_bot}`);
  logger.log(` PREFIX: ${global.config.prefix}`)
  logger.log("┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n");

  // Run cleanup every 10 minutes
  schedule.scheduleJob("*/10 * * * *", () => {
    cleanOldMessages();
  });

  const api = await login();

  global.api = api;

  logger.log("Đã đăng nhập thành công", "info");

  await loaderCommand();
  await loaderEvent();

  listener(api);

})();
