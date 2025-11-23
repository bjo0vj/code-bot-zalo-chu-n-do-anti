const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { getMessageCache } = require('../../utils/index');

module.exports.config = {
  name: 'adc',
  version: '1.0.0',
  role: 2,
  author: "TDF-2803", // phát triển từ mdl gốc của D-Jukie
  description: 'Áp dụng code hoặc tải code lên',
  category: 'Hệ Thống',
  usages: 'adc [reply hoặc tên file]',
  cooldowns: 2,
  dependencies: { "cheerio": "" }
};

module.exports.run = async function ({ api, event, args }) {
  const { threadId, type, data } = event;

  if (!args[0]) return api.sendMessage("Vui lòng nhập tên file hoặc reply link chứa code!", threadId, type);

  const name = args[0].replace(/\.js$/, '');
  let link;

  if (data?.quote?.cliMsgId) {
    const messageCache = getMessageCache()[data.quote.cliMsgId];
    link = messageCache?.content?.trim();
  }

  if (!link) {
    const filePath = path.join(__dirname, `${name}.js`);
    try {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const dpasteUrl = await uploadToDpaste(fileData);
      return api.sendMessage(`${dpasteUrl}`, threadId, type);
    } catch {
      return api.sendMessage(`Không tìm thấy file "${name}.js" để upload.`, threadId, type);
    }
  }

  const urlRegex = /https?:\/\/[^\s]+/g;
  const matched = link.match(urlRegex);
  if (!matched || matched.length === 0) {
    return api.sendMessage("Vui lòng chỉ reply 1 link hợp lệ!", threadId, type);
  }

  const url = matched[0];

  try {
    if (url.includes('pastebin')) {
      const { data } = await axios.get(url);
      await writeCodeToFile(name, data, api, threadId, type);
    }

    else if (url.includes('dpaste.com')) {
      const rawUrl = url.endsWith('.txt') ? url : `${url}.txt`;
      const { data } = await axios.get(rawUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      await writeCodeToFile(name, data, api, threadId, type);
    }

    else if (url.includes('buildtool') || url.includes('tinyurl.com')) {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const codeBlock = $('.language-js').first();
      const code = codeBlock?.text()?.trim();

      if (!code) {
        return api.sendMessage('Không tìm thấy code trong trang.', threadId, type);
      }

      await writeCodeToFile(name, code, api, threadId, type);
    }

    else if (url.includes('drive.google')) {
      const idMatch = url.match(/[-\w]{25,}/);
      if (!idMatch) return api.sendMessage("Không lấy được ID từ link Google Drive.", threadId, type);
      const fileID = idMatch[0];
      const savePath = path.join(__dirname, `${name}.js`);
      await downloadFile(`https://drive.google.com/u/0/uc?id=${fileID}&export=download`, savePath);
      return api.sendMessage(`Đã tải plugin "${name}.js". Hãy dùng cmd load ${name} để sử dụng.`, threadId, type);
    }

    else {
      return api.sendMessage("Không hỗ trợ link này.", threadId, type);
    }
  } catch (err) {
    return api.sendMessage(`Lỗi khi xử lý: ${err.message}`, threadId, type);
  }
};

async function writeCodeToFile(name, code, api, threadId, type) {
  const filePath = path.join(__dirname, `${name}.js`);
  fs.writeFile(filePath, code, 'utf-8', (err) => {
    if (err) {
      return api.sendMessage(`Không thể ghi file "${name}.js".`, threadId, type);
    }
    api.sendMessage(`Đã tải plugin "${name}.js". Hãy dùng cmd load ${name} để sử dụng.`, threadId, type);
  });
}

async function uploadToDpaste(code) {
  try {
    const response = await axios.post(
      'https://dpaste.com/api/v2/',
      `content=${encodeURIComponent(code)}&syntax=text&expiry_days=7`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0'
        }
      }
    );
    if (response.data?.startsWith('https://dpaste.com/')) {
      return response.data.trim() + '.txt';
    } else {
      throw new Error('Phản hồi không hợp lệ từ Dpaste.');
    }
  } catch (error) {
    throw new Error("Không thể upload lên dpaste: " + error.message);
  }
}

async function downloadFile(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
