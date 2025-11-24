const axios = require('axios');

module.exports.config = {
  name: 'ask',
  version: '1.0.0',
  role: 0,
  author: "TDF-2803",
  description: 'Hỏi chatgpt',
  category: 'Tiện ích',
  usage: 'ask <text>',
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ args, event, api, Users }) => {
  const { threadId, type } = event;

  if (!args[0]) {
    return api.sendMessage('Vui lòng nhập câu hỏi của bạn!', threadId, type);
  }

  try {
    const response = await axios.get('https://api.zeidteam.xyz/ai/chatgpt4?prompt=' + encodeURIComponent(args.join(' ')));

    const text = response.data.response;

    await api.sendMessage(text, threadId, type);

  } catch (error) {
    console.error('Lỗi khi gọi API GPT:', error.message || error);
    return api.sendMessage('Đã xảy ra lỗi khi kết nối với GPT. Vui lòng thử lại sau!', threadId, type);
  }
};
