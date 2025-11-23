module.exports.config = {
  name: 'restart',
  asliases: ['rs'],
  version: '1.0.0',
  role: 2,
  author: "TDF-2803",
  description: 'Khởi động lại bot',
  category: 'Hệ thống',
  usage: 'restart',
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ event, api }) => {
  const { threadId, type } = event;

  await api.sendMessage("Tiến hành khởi động lại bot", threadId, type);

  return process.exit(2);
};
