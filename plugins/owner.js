//==============================//
// 👑 OMMY-MD OWNER COMMAND 👑
//==============================//

const fs = require("fs");
const path = require("path");

module.exports = {
  name: "owner",
  description: "💫 Show official owner info stylishly",
  async execute(sock, m) {
    try {
      const ownerJid = "255760317060@s.whatsapp.net"; // 👑 Owner Number
      const ownerName = "👑 Ommy (BEN WHITTAKER TECH)";
      const brand = "💫 OMMY-MD SYSTEM";
      const imagePath = path.join(__dirname, "../audios/OMMY-MD.png");

      // 🔥 Reaction Emoji
      await sock.sendMessage(m.key.remoteJid, {
        react: { text: "👑", key: m.key },
      });

      // 🖼️ Stylish Caption
      const caption = `
╭──────────────◆
│ 👑 *OFFICIAL BOT OWNER*
│
│ 💫 *Name:* ${ownerName}
│ 📞 *Number:* wa.me/255624236654
│ 🏷️ *Brand:* ${brand}
│ 💻 *Developer:* Ommy
│ 🔰 *Power:* BEN WHITTAKER TECH
│
│  ✨ "Code like a King 👑, Rule with AI 🤖"
╰────────────────◆
`;

      // 🖼️ Send image with caption
      await sock.sendMessage(m.key.remoteJid, {
        image: fs.readFileSync(imagePath),
        caption,
      });

    } catch (error) {
      console.error("❌ Owner command error:", error);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Samahani, hitilafu imejitokeza wakati wa kuonyesha taarifa za owner.",
      });
    }
  },
};
