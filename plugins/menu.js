const fs = require("fs");
const path = require("path");
const { smd } = require("../index"); // ⚡ Command handler

module.exports = {
  name: "menu",
  description: "💎 Modern auto-loaded menu with categories",
  async execute(sock, m, prefix = "!") {
    try {
      const baseDir = path.join(__dirname);
      const categories = {};

      // === Scan command folders automatically ===
      fs.readdirSync(baseDir).forEach(folder => {
        const folderPath = path.join(baseDir, folder);
        if (fs.lstatSync(folderPath).isDirectory()) {
          const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".js"));
          categories[folder] = [];

          for (const file of files) {
            const commandFile = require(path.join(folderPath, file));
            if (commandFile.name) categories[folder].push({
              name: commandFile.name,
              desc: commandFile.description || "No description"
            });
          }
        }
      });

      // === Fancy Menu Header ===
      let menuMessage = `
╭─💎──────────────────╮
│  💠 *${global.botname || "OMMY-MD Bot"}*
│  ⚙️ Prefix: ${prefix}
│  👑 Owner: ${global.owner || "255624236654"}
│  📆 ${new Date().toLocaleDateString()}
╰─────────────────────╯

📂 *Command Categories*
`;

      // === Build Category Sections ===
      for (const cat in categories) {
        if (categories[cat].length === 0) continue;
        menuMessage += `\n┌─「 *${cat.toUpperCase()}* 」───💎\n`;
        categories[cat].forEach(cmd => {
          menuMessage += `│ 💠 *${prefix}${cmd.name}* → ${cmd.desc}\n`;
        });
        menuMessage += "└───────────────◆\n";
      }

      // === Footer ===
      menuMessage += `
💎 *Total Categories:* ${Object.keys(categories).length}
📜 *Total Commands:* ${Object.values(categories).flat().length}

🤖 _Powered by Ben Whittaker Tech_
`;

      await sock.sendMessage(m.key.remoteJid, { text: menuMessage }, { quoted: m });
    } catch (err) {
      console.error("❌ MENU ERROR:", err);
      await sock.sendMessage(m.key.remoteJid, { text: "⚠️ Error loading menu." }, { quoted: m });
    }
  },
};

// Register command with smd
smd({
  pattern: "menu",
  fromMe: true,
  desc: "💎 Show all commands by category",
}, async (msg, args, sock) => {
  await module.exports.execute(sock, msg, global.Config.prefix);
});
