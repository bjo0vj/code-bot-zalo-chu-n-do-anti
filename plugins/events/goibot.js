module.exports.config = {
    event_type: ["message"],
    name: "goibot",
    version: "1.0.0",
    author: "TDF-2803",
    description: "Gọi bot",
    dependencies: {}
};

module.exports.run = async ({ event, eventType, api, replyData }) => {
    const { threadId, type, data} = event;
    const content = data.content;
    
    if (eventType == 'message' && typeof content === 'string') {
        var tl = ["Fact: Chửi bot là đ*o biết xài bot :)", "bạn gọi tôi có việc gì?", "tôi yêu bạn vai lon", "Yêu em <3", "Hi, chào con vợ bé:3", "Chồng gọi có việc gì không?", "Em là bot cute nhất hành tinh", "Nói gì thế con lợn", "Em đây~~~~", "Yêu bé thí nhất:3", "Sao thế công chúa", "Bae ăn cơm chưa?", "Nếu cậu đang cô đơn thì chúng ta có thể thành đôi :3", "Cút ra", "Công chúa em sao đấy?", "Có gì ăn không:(( đói quáaa", "Yêu em không?", "Chồng em đây rồi", "Kêu chi lắm thế? Bộ thích tao rồi à :v", "Chần chờ gì chồng ơi em đâyyy", "Chần chờ gì vợ ơi anh đâyyy", "Em... Sao em lại nói những cái lời đó chi zay em?", "Yeu em rat nhieu ^^", "Đồ con lợn lùn :))", "Đợi xí. Đi ẻ cái :()", "Yeu anh den luy ^^", "Thuc khuya co hai cho suc khoe ^^", "Bae, em nhu bong hoa. Nhung nguoi hai dau phai ta 💔", "Nuôi cậu để thịt ~~", "Overnight không?", "Hát đi cho kẹo 🍭"];
        var rand = tl[Math.floor(Math.random() * tl.length)]
        switch (content.toLowerCase()) {
            case 'bot':
            case 'bot ơi':
                return api.sendMessage({ msg: rand, quote: replyData }, threadId, type);
        }
    }
}
