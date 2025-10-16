// plugins/antiporn.js
const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

// DB folder na file
const dbFolder = path.join(__dirname, "../db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const dbPath = path.join(dbFolder, "antiporn.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warnings: {} }, null, 2));

// Load/Save DB
function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Core function
async function handlePorn(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // only groups
  const sender = m.key.participant || from;

  const db = loadDB();
  if (!db.groups[from]) return; // Anti-Porn OFF

  try {
    const isSticker = m.message?.stickerMessage;
    const isVideo = m.message?.videoMessage;
    if (!isSticker && !isVideo) return;

    // Delete message
    await sock.sendMessage(from, { delete: m.key });

    // Update warnings
    db.warnings[sender] = (db.warnings[sender] || 0) + 1;
    saveDB(db);

    const remaining = 3 - db.warnings[sender];

    // Send fancy box message
    await sock.sendMessage(from, {
      text: `
╭─❮ ⚠️ ANTI-PORN ALERT ❯─☆
│ 🚫 @${sender.split("@")[0]} sent inappropriate content!
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
    console.error("AntiPorn Error:", e.message);
  }
}

// Toggle command
smd({
  pattern: "antiporn",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Porn On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();

  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Porn activated ✅\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Porn deactivated ⚠️\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antiporn on/off*");
  }
});

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-Porn",
}, async (msg, args, client) => {
  await handlePorn(client, msg);
});
