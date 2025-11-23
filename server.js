const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot Zalo đang chạy OK!"));

app.listen(3000, () => {
    console.log("Keep-alive server chạy cổng 3000");
});
