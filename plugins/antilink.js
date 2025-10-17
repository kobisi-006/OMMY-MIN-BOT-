//═══════════════════════════════════════════════//
// 🚫 OMMY-MD ANTI-LINK SYSTEM (ENGLISH PRO v2.3)
// 👑 Developer: Ben Whittaker (OMMY-MD BRAND)
//═══════════════════════════════════════════════//

const fs = require("fs");
const path = require("path");

// Database
const dbPath = path.join(__dirname, "../db/antilink.json");
if (!fs.existsSync(dbPath))
  fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warns: {} }, null, 2));

const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

// Deep detection for links
const linkRegex = /(https?:\/\/)?(www\.)?([a-z0-9-]+\.)?(chat\.whatsapp\.com|discord\.gg|t\.me|telegram\.me|instagram\.com|youtu\.be|youtube\.com|tiktok\.com|facebook\.com|fb\.me|bit\.ly|tinyurl\.com|linktr\.ee)/gi;

module.exports = {
  name: "antilink",
  description: "⚙️ Enable/disable Anti-Link protection in groups",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us"))
      return sock.sendMessage(from, { text: "❌ This command works only in groups!" });

    const db = loadDB();
    const cmd = (args[0] || "").toLowerCase();

    if (cmd === "on") {
      db.groups[from] = true;
      saveDB(db);
      await sock.sendMessage(from, { text: "✅ *Anti-Link enabled!* 🛡️ OMMY-MD Protection active." });
    } else if (cmd === "off") {
      db.groups[from] = false;
      saveDB(db);
      await sock.sendMessage(from, { text: "⚠️ *Anti-Link disabled!* Links will not be deleted." });
    } else {
      await sock.sendMessage(from, { text: "💡 Usage:\n• antilink on — enable\n• antilink off — disable" });
    }
  },

  async onMessage(sock, m) {
    try {
      const from = m.key.remoteJid;
      const sender = m.key.participant || m.key.remoteJid;
      if (!from.endsWith("@g.us")) return;

      const db = loadDB();
      if (!db.groups[from]) return; // OFF

      const text =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        "";

      if (!text || !linkRegex.test(text)) return;

      // Group metadata
      const metadata = await sock.groupMetadata(from).catch(() => null);
      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const isBotAdmin = metadata?.participants?.some((p) => p.id === botNumber && p.admin);

      // Increment warnings
      db.warns[sender] = (db.warns[sender] || 0) + 1;
      saveDB(db);
      const remaining = 3 - db.warns[sender];

      // Alert box
      const alertMsg = `
╭───🚨 ANTI-LINK ALERT 🚨───╮
│ 🔗 Link detected!
│ 👤 @${sender.split("@")[0]}
│ ⚠️ Warning: ${db.warns[sender]}/3
│ ⏳ Warnings left: ${remaining}
╰────────────────────────╯
💎 OMMY-MD Protection
`;

      // React emoji
      await sock.sendMessage(from, { react: { text: "🚫", key: m.key } });

      // Delete if bot admin
      if (isBotAdmin) await sock.sendMessage(from, { delete: m.key });

      // Send alert
      await sock.sendMessage(from, { text: alertMsg, mentions: [sender] });

      // Kick after 3 warnings
      if (db.warns[sender] >= 3) {
        if (isBotAdmin) {
          await sock.groupParticipantsUpdate(from, [sender], "remove");
          await sock.sendMessage(from, { text: `🚷 @${sender.split("@")[0]} removed after 3 warnings!`, mentions: [sender] });
        } else {
          await sock.sendMessage(from, { text: `⚠️ @${sender.split("@")[0]} reached 3 warnings but bot is not admin!`, mentions: [sender] });
        }
        db.warns[sender] = 0;
        saveDB(db);
      }
    } catch (e) {
      console.error("❌ Anti-Link Error:", e.message);
    }
  },
};
