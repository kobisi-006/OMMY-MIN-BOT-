const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antiporn.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, users: {}, adminsNotify: {} }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Toggle on/off
smd({
  pattern: "antiporn",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Porn system On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();
  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Porn mode activated for this group\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Porn mode deactivated for this group\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antiporn on/off*");
  }
});

// Auto-detect porn content
smd({
  pattern: "autoporn",
  fromMe: false,
  desc: "🚫 Auto-delete porn content & warn",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return;

  const db = loadDB();
  if (!db.groups[from]) return; // system off

  try {
    const textMsg = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const isSticker = !!msg.message.stickerMessage;
    const isImage = !!msg.message.imageMessage;
    const isVideo = !!msg.message.videoMessage;
    const containsLink = /(https?:\/\/[^\s]+)/gi.test(textMsg);
    const containsHashtag = /#(porn|nsfw|xxx|18\+)/gi.test(textMsg);

    if (!isSticker && !isImage && !isVideo && !containsLink && !containsHashtag) return;

    // Delete message
    await client.sendMessage(from, { delete: msg.key });

    // Update warn
    db.users[from] = db.users[from] || {};
    db.users[from][sender] = (db.users[from][sender] || 0) + 1;

    saveDB(db);
    const warnCount = db.users[from][sender];

    // Box-style warn
    const reason = isSticker ? "Porn sticker" :
                   isImage ? "NSFW image" :
                   isVideo ? "Video" :
                   containsLink ? "Porn link" :
                   containsHashtag ? "Porn hashtag" : "Porn content";

    const box = `
╔══════════════════╗
║ ⚠️ WARN NOTICE
╠══════════════════╣
║ 👤 Name : @${sender.split("@")[0]}
║ ❌ Reason : ${reason}
║ 🟡 Warn : ${warnCount}/3
║ 💥 Deleted by OMMY-MD
║ 🚫 Do not send porn content!
╚══════════════════╝
    `.trim();

    await client.sendMessage(from, { text: box, mentions: [sender] });

    // Notify admin if user reached 2 warns
    if (warnCount === 2) {
      const groupMetadata = await client.groupMetadata(from);
      const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
      for (let admin of admins) {
        await client.sendMessage(admin, {
          text: `⚠️ @${sender.split("@")[0]} has 2 warns. Please monitor.\n🏷️ OMMY-MD 💥`,
          mentions: [sender]
        });
      }
    }

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

    console.log(`✅ AutoPorn: deleted & warn issued to ${sender}`);
  } catch (err) {
    console.error("❌ AutoPorn Error:", err.message);
  }
});
