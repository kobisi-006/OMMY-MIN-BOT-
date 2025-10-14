// plugins/antilink.js
const { smd } = require('../lib/smd');
const fs = require('fs');

const dbPath = './antilink-db.json';

// 🔄 Load / Save database
function loadDB() {
  if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath));
  return {};
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null,2));
}

// ⚙️ Command to enable/disable Anti-Link per group
smd({
  pattern: 'antilink',
  fromMe: true,
  desc: '🚫 Toggle Anti-Link ON/OFF for this group'
}, async (message, match, client) => {
  const chatId = message.jid;
  const text = match?.trim()?.toLowerCase();
  const db = loadDB();
  if (!db[chatId]) db[chatId] = { enabled: false, warns: {} };

  if (text === 'on') {
    db[chatId].enabled = true;
    saveDB(db);
    return await message.reply("✅ Anti-Link is now *ENABLED* for this group!");
  } else if (text === 'off') {
    db[chatId].enabled = false;
    saveDB(db);
    return await message.reply("❌ Anti-Link is now *DISABLED* for this group!");
  }

  await message.reply(`⚙️ Anti-Link status: ${db[chatId].enabled ? "ON ✅" : "OFF ❌"}\nUse \`.antilink on/off\` to toggle.`);
});

// 🛡️ Listener for detecting links
smd({
  on: 'message'
}, async (message, match, client) => {
  const chatId = message.jid;
  const db = loadDB();
  if (!db[chatId] || !db[chatId].enabled) return;

  const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
  if (!text) return;

  // ⚠️ Regex for common links
  const linkRegex = /(https?:\/\/)?(www\.)?(wa\.me|telegram\.me|instagram\.com|tiktok\.com|youtu\.be|youtube\.com)\/[^\s]+/i;
  if (!linkRegex.test(text)) return;

  const sender = message.sender;
  const botNumber = client.user?.id || client.user?.jid;

  // 🛑 Ignore bot owner
  const ownerNumber = "255624236654@s.whatsapp.net"; // Badilisha na number yako
  if ([ownerNumber, botNumber].includes(sender)) return;

  // ⚠️ Warn user
  if (!db[chatId].warns[sender]) db[chatId].warns[sender] = 0;
  db[chatId].warns[sender] += 1;
  const warns = db[chatId].warns[sender];
  saveDB(db);

  // ❌ Delete the message
  try { await client.sendMessage(chatId, { delete: message.key }); } catch {}

  // ⚠️ Send warning
  await client.sendMessage(chatId, {
    text: `⚠️ @${sender.split('@')[0]} — Posting links is not allowed!\nWarning ${warns}/3`,
    mentions: [sender]
  });

  // 🚨 Kick user after 3 warnings (if bot is admin)
  if (warns >= 3) {
    try {
      await client.groupParticipantsUpdate(chatId, [sender], 'remove');
      await client.sendMessage(chatId, { text: `🚫 @${sender.split('@')[0]} has been removed after 3 warnings!`, mentions: [sender] });
      delete db[chatId].warns[sender];
      saveDB(db);
    } catch {
      await client.sendMessage(chatId, { text: "⚠️ Failed to kick user. Make sure bot is admin." });
    }
  }
});
