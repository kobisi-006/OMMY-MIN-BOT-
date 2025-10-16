const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antilink.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, users: {} }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Toggle On/Off
smd({
  pattern: "antilink",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Link system On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();
  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Link mode activated for this group\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Link mode deactivated for this group\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antilink on/off*");
  }
});

// Auto-detect links
smd({
  pattern: "autolink",
  fromMe: false,
  desc: "🚫 Auto-delete links & warn",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return;

  const db = loadDB();
  if (!db.groups[from]) return; // system off

  try {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    if (!linkRegex.test(textMsg)) return;

    // Delete message
    await client.sendMessage(from, { delete: msg.key });

    // Update warn
    db.users[from] = db.users[from] || {};
    db.users[from][sender] = (db.users[from][sender] || 0) + 1;
    saveDB(db);
    const warnCount = db.users[from][sender];

    // Box-style warning
    const box = `
╔══════════════════╗
║ ⚠️ WARN NOTICE
╠══════════════════╣
║ 👤 Name : @${sender.split("@")[0]}
║ ❌ Reason : Sent a link 🚫
║ 🟡 Warn : ${warnCount}/3
║ 💥 Deleted by OMMY-MD
║ 🚫 Do not send links in this group!
╚══════════════════╝
    `.trim();

    await client.sendMessage(from, { text: box, mentions: [sender] });

    // Kick if 3 warns
    if (warnCount >= 3) {
      await client.groupParticipantsUpdate(from, [sender], "remove");
      await client.sendMessage(from, {
        text: `🚨 @${sender.split("@")[0]} has been removed (3 warns)!\n🏷️ OMMY-MD 💥`,
        mentions: [sender]
      });
      db.users[from][sender] = 0;
      saveDB(db);
    }

    console.log(`✅ AutoLink: deleted & warn issued to ${sender}`);
  } catch (err) {
    console.error("❌ AutoLink Error:", err.message);
  }
});
