const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

smd({
  pattern: "help",
  fromMe: false,
  desc: "📜 Show bot brand with music (no command list)"
}, async (msg, args, client) => {
  try {
    const chatId = msg.key.remoteJid;

    // ==== Paths za media ====
    const imgPath = path.join(__dirname, "../audios/OMMY-MD.png");
    const audioPath = path.join(__dirname, "../audios/LUNA BALA (Slowed).mp3");

    // ==== Decorative Box ====
    const brandBox = `
╭─❮ 🤖 OMMY-MD HELP ❯─☆
│ 🌟 Welcome to OMMY-MD Bot
│ 💥 Your ultimate WhatsApp assistant
│ 🎶 Music, AI, Anti-Link, Anti-Spam & more
╰───────────────☆
    `;

    // ==== Send image with brand ====
    if (fs.existsSync(imgPath)) {
      await client.sendMessage(chatId, {
        image: { url: imgPath },
        caption: brandBox
      }, { quoted: msg });
    } else {
      // fallback if image missing
      await msg.send(brandBox);
    }

    // ==== Play audio (voice note) ====
    if (fs.existsSync(audioPath)) {
      await client.sendMessage(chatId, {
        audio: { url: audioPath },
        mimetype: "audio/mp4",
        ptt: true
      });
    }

    // Optional: react with emoji
    await msg.react("🎵");

  } catch (err) {
    console.error("❌ Help command error:", err);
    await msg.send("🚫 Failed to show help!");
  }
});
