const { smd } = require("../index");
const fs = require("fs");
const path = require("path");

smd({
  pattern: "ping",
  fromMe: false,
  desc: "Check bot speed minimal with brand",
}, async (msg, args, client) => {
  const latency = Date.now() - (msg.messageTimestamp * 1000 || Date.now());

  // Reaction only
  await msg.react("🏓");

  // Build single message box
  let boxMessage = `
╭─❮ 🏓 PING ❯─☆
│ ⚡ Speed: ${latency}ms
╰─────────────☆
🏷️ OMMY-MD 💥
`;

  const audioFolder = path.join(__dirname, "../audios");
  if (fs.existsSync(audioFolder)) {
    const files = fs.readdirSync(audioFolder).filter(f => f.endsWith(".mp3"));
    if (files.length > 0) {
      const randomFile = path.join(audioFolder, files[Math.floor(Math.random() * files.length)]);
      await client.sendMessage(msg.key.remoteJid, {
        text: boxMessage,
        audio: { url: randomFile },
        mimetype: "audio/mp4",
        ptt: true
      }, { quoted: msg });
      return; // done, message + audio in one
    }
  }

  // If no audio, just send box
  await msg.send(boxMessage);
});
