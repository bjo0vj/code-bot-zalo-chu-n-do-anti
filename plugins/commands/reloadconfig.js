module.exports.config = {
  name: 'reloadconfig',
  version: '1.0.0',
  role: 2,
  author: "TDF-2803",
  description: 'Tải lại config',
  category: 'Hệ thống',
  usage: 'reloadconfig',
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ event, api }) => {
  const { threadId, type } = event;

  const { reloadConfig } = require("../../utils/index");

  await reloadConfig();

  return api.sendMessage("Tải lại config thành công", threadId, type);

};
