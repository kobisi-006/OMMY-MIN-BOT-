// plugins/antimentionstatus.js
const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antimentionstatus.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warnings: {} }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

async function handleMentionStatus(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // only groups
  const sender = m.key.participant || m.key.remoteJid;
  const db = loadDB();
  if (!db.groups[from]) return;

  const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length === 0) return;

  try {
    // Attempt delete
    if (m.key?.id) await sock.sendMessage(from, { delete: m.key });

    // Add warn
    db.warnings[sender] = (db.warnings[sender] || 0) + 1;
    saveDB(db);

    const remaining = 3 - db.warnings[sender];
    await sock.sendMessage(from, {
      text: `
╭─❮ ⚠️ ANTI-MENTION STATUS ❯─☆
│ 🚫 @${sender.split("@")[0]} attempted a mention status!
│ ⚠️ Warnings remaining: ${remaining}/3
╰───────────────☆
🏷️ OMMY-MD 💥
      `,
      mentions: [sender]
    });

    if (db.warnings[sender] >= 3) {
      await sock.groupParticipantsUpdate(from, [sender], "remove");
      db.warnings[sender] = 0;
      saveDB(db);
      await sock.sendMessage(from, {
        text: `🚨 @${sender.split("@")[0]} has been removed (3 warns)!`,
        mentions: [sender],
      });
    }
    console.log(`✅ AntiMentionStatus triggered for ${sender}`);
  } catch (e) {
    console.error("AntiMentionStatus Error:", e);
  }
}

// Toggle command
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
  pattern: ".*",
  fromMe: false,
  desc: "Internal hook for Anti-MentionStatus",
}, async (msg, args, client) => {
  await handleMentionStatus(client, msg);
});
