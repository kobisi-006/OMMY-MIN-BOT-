// plugins/antitag.js
const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

// DB folder na file
const dbFolder = path.join(__dirname, "../db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const dbPath = path.join(dbFolder, "antitag.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {} }, null, 2));

// Load/Save DB
function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Core function
async function handleAntiTag(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // only groups

  const db = loadDB();
  if (!db.groups[from]) return; // Anti-Tag OFF

  try {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length > 0) {
      // Delete message
      await sock.sendMessage(from, { delete: m.key });
      await sock.sendMessage(from, {
        text: `
╭─❮ ⚠️ ANTI-TAG ALERT ❯─☆
│ 🚫 @${m.key.participant.split("@")[0]} attempted to tag!
│ ❌ Message deleted!
╰───────────────☆
🏷️ OMMY-MD 💥
        `,
        mentions
      });
      console.log(`✅ Anti-Tag deleted a mention in ${from}`);
    }
  } catch (e) {
    console.error("AntiTag Error:", e.message);
  }
}

// Toggle command
smd({
  pattern: "antitag",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Tag On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();

  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Tag activated ✅\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Tag deactivated ⚠️\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antitag on/off*");
  }
});

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-Tag",
}, async (msg, args, client) => {
  await handleAntiTag(client, msg);
});
