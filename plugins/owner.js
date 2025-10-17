const fs = require("fs");
const path = require("path");
const { smd, Config } = require("../index");

const OWNER_PIC = path.join(__dirname, "../audios/OMMY-MD.png");

smd({
  pattern: "owner",
  fromMe: false,
  desc: "👑 Show Bot Owner Info",
}, async (msg, args, sock) => {
  try {
    // React emoji
    await msg.react("👑");

    // Get bot groups info
    const groups = await sock.groupFetchAllParticipating();
    const totalGroups = Object.keys(groups).length;

    // Message box with bold text
    const text = `
╭─👑 *OMMY-MD BOT OWNER* ──╮
│ 🤖 *Bot Name:* *${Config.caption}*
│ 📱 *Owner:* *${Config.owner}*
│ 🌐 *Total Groups:* *${totalGroups}*
│ ⚡ *Version:* *v2.5 Pro*
╰─────────────────────╯
`;

    // Send message with image
    if (fs.existsSync(OWNER_PIC)) {
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: OWNER_PIC },
        caption: text
      });
    } else {
      await msg.send(text);
    }

  } catch (e) {
    console.error("❌ Owner Command Error:", e.message);
    await msg.send("❌ *Failed to fetch owner info!*");
  }
});
