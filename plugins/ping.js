const { smd } = require("../index");
const fs = require("fs");
const path = require("path");

smd({
  pattern: "ping",
  fromMe: false,
  desc: "Check bot speed",
}, async (msg, args, client) => {
  const latency = Date.now() - (msg.messageTimestamp * 1000 || Date.now());
  const now = new Date();
  const time = now.toLocaleTimeString();
  const date = now.toLocaleDateString();

  await msg.react("🏓");
  await msg.send("🏓 Checking ping...");

  const audioFolder = path.join(__dirname, "../audios");
  if (fs.existsSync(audioFolder)) {
    const files = fs.readdirSync(audioFolder).filter(f => f.endsWith(".mp3"));
    if (files.length > 0) {
      const randomFile = path.join(audioFolder, files[Math.floor(Math.random() * files.length)]);
      await client.sendMessage(msg.key.remoteJid, {
        audio: { url: randomFile },
        mimetype: "audio/mp4",
        ptt: true
      }, { quoted: msg });
    }
  }

  await msg.send(`
╭─❮ 🏓 PING STATUS ❯─☆
│ ⚡ Speed: ${latency}ms
│ ⏰ Time: ${time}
│ 📅 Date: ${date}
│ 🤖 Status: ✅ Active
╰───────────────☆`);
});
