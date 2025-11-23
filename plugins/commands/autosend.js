const fs = require('fs');
const axios = require('axios');
const { ThreadType } = require("zca-js");

const autosendgif = require('../../assets/autosend.json');

module.exports.config = {
  name: 'autosend',
  version: '1.0.1',
  role: 1,
  author: "TDF-2803",
  description: 'Tự động gửi tin nhắn theo giờ đã cài và tự xóa sau 5 phút',
  category: "Tiện ích",
  usage: 'autosend on/off',
  cooldowns: 2
};

// Danh sách thời gian và nội dung tự động gửi
const setting = [
  {
    timer: '06:00:00 AM',
    message: [
      'Chúc mọi người buổi sáng vui vẻ😉',
      'Buổi sáng đầy năng lượng nhaa các bạn😙',
      'Dậy đi học và đi làm nào mọi người ơi😁',
      'Dậy sớm thành công rồi đó, cố lên nhé!💪'
    ]
  },
  {
    timer: '09:22:00 PM',
    message: [
      'Dậy đi học nào các bạn ơi',
    ]
  },
  {
    timer: '01:45:00 PM',
    message: [
      'Còn 15p thôi đi học nào mọi người ơi',
    ]
  },
];

const form = `➢𝐍𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧🏆
➝ Bây Giờ Là: %time_now
➝ Đây Là Tin Nhắn Tự Động
━━━━━━━━━━━
[ 𝗡𝗢̣̂𝗜 𝗗𝗨𝗡𝗚 ]  %content`;

module.exports.onLoad = async function ({ api, Threads }) {
  const path = __dirname + '/temp/';

  if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true });

  setInterval(autosend, 1000);

  async function autosend() {
    const now = new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const matched = setting.find(item => item.timer === now);
    if (!matched) return;

    const randomMessage = matched.message[Math.floor(Math.random() * matched.message.length)];
    const msg = form
      .replace(/%time_now/g, matched.timer)
      .replace(/%content/g, randomMessage);

    const fileName = `autosend.gif`;
    const filePath = path + fileName;

    try {
      const imageUrl = autosendgif[Math.floor(Math.random() * autosendgif.length)];

      const res = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://imgur.com/',
          'Accept': 'image/*,*/*;q=0.8'
        }
      });
      fs.writeFileSync(filePath, res.data);

    } catch (err) {
      console.error("Lỗi tải hoặc lưu ảnh:", err.message);
    }


    const allGroups = await api.getAllGroups();
    const allBoxIDs = Object.keys(allGroups.gridVerMap);

    for (const Group of allBoxIDs) {
      const Thread = await Threads.getData(Group);
      if (Thread.data.auto_send) {
        try {
          await api.sendMessage({
            msg: msg,
            attachments: filePath,
            ttl: 300000
          }, Thread.threadId, ThreadType.Group);
        } catch (err) {
          console.log(`Không gửi được tới threadId ${Thread.threadId}`);
          continue;
        }
      }
    }

    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Lỗi khi xóa file:', err);
    }
  }
};

module.exports.run = async ({ api, event, args, Threads }) => {
  const { threadId, type } = event;

  if (type === ThreadType.User) return api.sendMessage("❌ Lệnh chỉ có thể dùng trong nhóm", threadId, type);

  async function setAutoSend(id, status) {
    const thread = await Threads.getData(id);
    const data = thread.data;
    data.auto_send = status;
    await Threads.setData(id, data);
    return { id, status };
  }

  async function toggleAutoSend(id) {
    const thread = await Threads.getData(id);
    const data = thread.data;
    data.auto_send = !data.auto_send;
    await Threads.setData(id, data);
    return { id, status: data.auto_send };
  }

  // Handle "autosend all on/off"
  if (args[0] === "all") {
    const mode = args[1];
    if (mode !== "on" && mode !== "off") {
      return api.sendMessage(
        `❌ Vui lòng dùng đúng cú pháp: autosend all [on|off]`,
        threadId, type
      );
    }

    const statusToSet = mode === "on";
    const allGroups = await api.getAllGroups();
    const allBoxIDs = Object.keys(allGroups.gridVerMap);
    const results = [];

    for (const boxId of allBoxIDs) {
      const result = await setAutoSend(boxId, statusToSet);
      results.push(result);
    }

    return api.sendMessage(
      `✅ Đã ${statusToSet ? "bật" : "tắt"} autosend cho ${results.length} nhóm.`,
      threadId, type
    );
  }

  // Handle "autosend on"
  if (args[0] === "on") {
    const result = await setAutoSend(threadId, true);
    return api.sendMessage(
      `✅ Đã bật autosend cho nhóm này.\n📩 Bot sẽ tự động gửi tin nhắn theo lịch đã cài đặt.`,
      threadId, type
    );
  }

  // Handle "autosend off"
  if (args[0] === "off") {
    const result = await setAutoSend(threadId, false);
    return api.sendMessage(
      `❌ Đã tắt autosend cho nhóm này.\n📩 Bot sẽ không tự động gửi tin nhắn nữa.`,
      threadId, type
    );
  }

  // Toggle if no argument (backward compatibility)
  const result = await toggleAutoSend(threadId);
  return api.sendMessage(
    `📩 Autosend đã được ${result.status ? "bật ✅" : "tắt ❌"} cho nhóm này.`,
    threadId, type
  );
};
