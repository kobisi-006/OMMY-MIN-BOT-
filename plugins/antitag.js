// plugins/antitag.js
const { smd } = require("../lib/smd");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../antitag-db.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, "{}");

// Toggle command
smd({
  pattern: "antitag",
  fromMe: true,
  desc: "🛡️ Turn ON/OFF AntiTag system with warn, delete & kick",
}, async (message, match, client) => {
  const chatId = message.key.remoteJid;
  const text = match?.trim()?.toLowerCase();

  const db = JSON.parse(fs.readFileSync(dbPath));
  if (!db[chatId]) db[chatId] = { enabled: false, warns: {} };

  if (text === "on") {
    db[chatId].enabled = true;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return client.sendMessage(chatId, { text: "✅ *AntiTag system activated!* 🚫 Anyone tagging the owner/bot will be warned or kicked!" });
  } else if (text === "off") {
    db[chatId].enabled = false;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return client.sendMessage(chatId, { text: "❌ *AntiTag system turned off!*" });
  }

  client.sendMessage(chatId, { text: `⚙️ *AntiTag:* ${db[chatId].enabled ? "🟢 ON" : "🔴 OFF"}\nUse *.antitag on/off* to toggle.` });
});

// Auto-check messages
module.exports.autoAntiTag = async (sock, msgUpsert) => {
  try {
    const messages = msgUpsert.messages || [];
    const ownerNumber = "255624236654@s.whatsapp.net";
    const botNumber = sock.user.jid;

    const db = JSON.parse(fs.readFileSync(dbPath));

    for (const msg of messages) {
      const chatId = msg.key.remoteJid;
      if (!db[chatId] || !db[chatId].enabled) continue;

      const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentions.includes(ownerNumber) && !mentions.includes(botNumber)) continue;

      const sender = msg.key.participant || msg.key.remoteJid;
      const now = Date.now();

      if (!db[chatId].warns[sender]) db[chatId].warns[sender] = { count: 0, lastWarn: 0 };
      if (now - db[chatId].warns[sender].lastWarn < 10000) continue; // cooldown

      db[chatId].warns[sender].count++;
      db[chatId].warns[sender].lastWarn = now;
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

      // Delete offending message
      await sock.sendMessage(chatId, { delete: msg.key });

      // Send warning
      const warnMsg = `⚠️ *ANTI-TAG ALERT*\n👤 User: @${sender.split('@')[0]}\n📛 Warning: ${db[chatId].warns[sender].count}/3\n🚫 Reason: Tagging Owner/Bot`;
      await sock.sendMessage(chatId, { text: warnMsg, mentions: [sender] });

      // Kick if 3 warns
      if (db[chatId].warns[sender].count >= 3) {
        try {
          await sock.groupParticipantsUpdate(chatId, [sender], "remove");
          await sock.sendMessage(chatId, { text: `🔥 *User Removed!* @${sender.split('@')[0]} exceeded 3 warnings.`, mentions: [sender] });
          delete db[chatId].warns[sender];
          fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
        } catch {
          await sock.sendMessage(chatId, { text: "⚠️ Failed to remove user. Bot must be *admin*!" });
        }
      }
    }
  } catch (err) {
    console.log("❌ AntiTag Error:", err);
  }
};
