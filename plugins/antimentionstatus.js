const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antimentionstatus.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {} }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Core function: handle mention status
async function handleMentionStatus(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // only groups
  const db = loadDB();
  if (!db.groups[from]) return; // Anti-Mention OFF

  try {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length > 0) {
      // Delete mention status
      await sock.sendMessage(from, { delete: m.key });
      await sock.sendMessage(from, {
        text: `
╭─❮ ⚠️ ANTI-MENTION STATUS ❯─☆
│ ✅ Mention status removed!
╰───────────────☆
🏷️ OMMY-MD 💥
        `,
        mentions
      });
      console.log(`✅ Mention status deleted in ${from}`);
    }
  } catch (e) {
    console.error("AntiMentionStatus Error:", e.message);
  }
}

// Command to toggle On/Off
smd({
  pattern: "antimentionstatus",
  fromMe: true,
  desc: "⚙️ Toggle Anti-MentionStatus On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();

  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-MentionStatus activated ✅\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-MentionStatus deactivated ⚠️\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antimentionstatus on/off*");
  }
});

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-MentionStatus",
}, async (msg, args, client) => {
  await handleMentionStatus(client, msg);
});
