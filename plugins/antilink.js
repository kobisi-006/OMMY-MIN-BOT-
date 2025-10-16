// plugins/antilink.js
const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

// DB folder na file
const dbFolder = path.join(__dirname, "../db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const dbPath = path.join(dbFolder, "antilink.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warnings: {} }, null, 2));

// Load/Save DB
function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Core function
async function handleLink(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // only groups
  const sender = m.key.participant || from;

  const db = loadDB();
  if (!db.groups[from]) return; // Anti-Link OFF

  const text = m.message?.conversation || m.message?.extendedTextMessage?.text;
  if (!text) return;

  const linkRegex = /(https?:\/\/)?(www\.)?(discord\.gg|t\.me|chat\.whatsapp\.com|instagram\.com|youtu\.be|youtube\.com|bit\.ly|tiktok\.com)/gi;
  if (linkRegex.test(text)) {
    try {
      // Delete message
      await sock.sendMessage(from, { delete: m.key });

      // Update warnings
      db.warnings[sender] = (db.warnings[sender] || 0) + 1;
      saveDB(db);

      const remaining = 3 - db.warnings[sender];

      // Send fancy box message
      await sock.sendMessage(from, {
        text: `
╭─❮ ⚠️ ANTI-LINK ALERT ❯─☆
│ 🚫 @${sender.split("@")[0]} sent a link!
│ ⚠️ Warnings remaining: ${remaining}/3
╰───────────────☆
🏷️ OMMY-MD 💥
        `,
        mentions: [sender]
      });

      // Kick if 3 warnings reached
      if (db.warnings[sender] >= 3) {
        await sock.groupParticipantsUpdate(from, [sender], "remove");
        await sock.sendMessage(from, {
          text: `🚨 @${sender.split("@")[0]} has been removed (3 warnings)!`,
          mentions: [sender],
        });
        db.warnings[sender] = 0; // reset
        saveDB(db);
      }
    } catch (e) {
      console.error("Anti-Link Error:", e.message);
    }
  }
}

// Toggle command
smd({
  pattern: "antilink",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Link On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();

  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Link activated ✅\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Link deactivated ⚠️\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antilink on/off*");
  }
});

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-Link",
}, async (msg, args, client) => {
  await handleLink(client, msg);
});
