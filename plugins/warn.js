const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/warns.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warnings: {} }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

smd({
  pattern: "warn",
  fromMe: true,
  desc: "⚠️ Issue a warning to a member",
}, async (msg, args, sock) => {
  try {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return msg.send("❌ *This command is only for groups!*");

    const db = loadDB();

    const replyMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!replyMsg) return msg.send("⚠️ *Reply to a user to issue a warning!*");

    const warnedUser = msg.message.extendedTextMessage.contextInfo.participant;

    // Initialize warnings
    if (!db.groups[from]) db.groups[from] = {};
    db.groups[from][warnedUser] = (db.groups[from][warnedUser] || 0) + 1;
    saveDB(db);

    const warnsLeft = 3 - db.groups[from][warnedUser];

    const text = `
╭─⚠️ *USER WARNING* ⚠️─╮
│ 👤 @${warnedUser.split("@")[0]}
│ ❌ Warning issued!
│ ⚠️ Remaining warnings: ${warnsLeft}/3
╰───────────────────╯
💎 *OMMY-MD BOT*
`;
    await sock.sendMessage(from, { text, mentions: [warnedUser] });
    await msg.react("⚠️");

    // Kick if 3 warnings reached
    if (db.groups[from][warnedUser] >= 3) {
      await sock.groupParticipantsUpdate(from, [warnedUser], "remove");
      await sock.sendMessage(from, {
        text: `🚷 @${warnedUser.split("@")[0]} has been removed after 3 warnings!`,
        mentions: [warnedUser],
      });
      db.groups[from][warnedUser] = 0; // reset
      saveDB(db);
    }

  } catch (e) {
    console.error("❌ Warn Command Error:", e.message);
    await msg.send("❌ *Failed to issue warning!*");
  }
});
