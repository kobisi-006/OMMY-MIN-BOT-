const { smd } = require("../index");
const path = require("path");
const fs = require("fs");

smd({
  pattern: "help",
  fromMe: false,
  desc: "📖 Show all bot commands with brand image and play audio"
}, async (msg, args, client) => {
  try {
    const commands = global.commands
      .filter(c => c.pattern !== "help" && c.pattern !== "message") // Exclude internal hooks
      .map(c => `│ 🔹 *${c.pattern}* - ${c.desc}`)
      .join("\n");

    const text = `
╭─❮ 🛠 OMMY-MD BOT HELP ❯─☆
│ 🤖 Prefix: *
│ 🏷️ Brand: OMMY-MD 💥
├────────────────────────
${commands}
╰─────────────────────────☆
`;

    const imgPath = path.join(__dirname, "../audios/OMMY-MD.png");
    const audioPath = path.join(__dirname, "../audios/LUNA BALA (Slowed).mp3");

    // Send image with caption
    if (fs.existsSync(imgPath)) {
      await client.sendMessage(msg.key.remoteJid, {
        image: { url: imgPath },
        caption: text
      }, { quoted: msg });
    } else {
      await msg.send(text);
    }

    // Play audio as voice note
    if (fs.existsSync(audioPath)) {
      await client.sendMessage(msg.key.remoteJid, {
        audio: { url: audioPath },
        mimetype: "audio/mp4",
        ptt: true
      }, { quoted: msg });
    }

  } catch (err) {
    console.error("Help command error:", err);
    await msg.send("❌ Failed to show commands!");
  }
});
