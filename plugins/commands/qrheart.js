const axios = require('axios');
const fs = require("fs");
const path = require('path');

module.exports.config = {
  name: 'qrheart',
  version: '1.0.0',
  role: 0,
  author: "TDF-2803",
  description: 'Tạo mã QR trái tim từ văn bản',
  category: 'Tiện ích',
  usage: 'qrcode <nội dung> - <chữ mô tả>',
  cooldowns: 2,
  dependencies: {}
};

module.exports.run = async ({ api, event, args }) => {
  const { threadId, type } = event;

  const input = args.join(' ').split('-');
  const text = input[0]?.trim();
  const caption = input[1]?.trim();

  if (!text) {
    return api.sendMessage('❌ Vui lòng nhập nội dung mã QR.\n\nCú pháp: qrheart <nội dung> - <caption>', threadId, type);
  }

  try {
    const url = `https://api.zeidteam.xyz/image-generator/qrcode-heart?text=${encodeURIComponent(text)}&caption=${encodeURIComponent(caption)}`;
    const res = await axios.get(url, { responseType: 'arraybuffer' });

    const filePath = path.join(__dirname, 'temp', `qrcode-heart_${Date.now()}.png`);

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    fs.writeFileSync(filePath, res.data);

    await api.sendMessage({
      msg: `Mã QR trái tim của bạn nè:`,
      attachments: filePath
    }, threadId, type);
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(error);
    api.sendMessage('Đã xảy ra lỗi khi tạo QR code!', threadId, type);
  }
};
