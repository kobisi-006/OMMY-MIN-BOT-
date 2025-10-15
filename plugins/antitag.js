// plugins/antitag.js
const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/antitag.json');

// 🔄 Load / Save DB
function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ⚙️ Command to enable/disable Anti-Tag per group
smd({
  pattern: 'antitag',
  fromMe: true,
  desc: '🚫 Enable or disable Anti-Tag (prevents tagging owner/admin)'
}, async (message, match, client) => {
  const chatId = message.jid;
  const text = match?.trim()?.toLowerCase();
  const db = loadDB();

  if (!db[chatId]) db[chatId] = { enabled: false };

  if (text === 'on') {
    db[chatId].enabled = true;
    saveDB(db);
    return await message.reply("✅ Anti-Tag is now *ENABLED* for this group! ⚠️");
  } else if (text === 'off') {
    db[chatId].enabled = false;
    saveDB(db);
    return await message.reply("❌ Anti-Tag is now *DISABLED* for this group! ✅");
  }

  await message.reply(`⚙️ Anti-Tag status: ${db[chatId].enabled ? "ON ✅" : "OFF ❌"}\nUse *.antitag on/off* to toggle.`);
});

// 🛡️ Listener for detecting mentions of owner/admin
smd({
  on: 'message'
}, async (message, match, client) => {
  const chatId = message.jid;
  const db = loadDB();
  if (!db[chatId]?.enabled) return;

  const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
  if (!text) return;

  const sender = message.sender;
  const botNumber = client.user?.id || client.user?.jid;
  const ownerNumber = "255624236654@s.whatsapp.net"; // badilisha na number yako
  const taggedNumbers = (message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []);

  // ⚠️ Check if owner or bot was tagged
  if (taggedNumbers.includes(ownerNumber) || taggedNumbers.includes(botNumber)) {
    // ❌ Delete offending message
    try { await client.sendMessage(chatId, { delete: message.key }); } catch {}

    // ⚠️ Send warning
    await client.sendMessage(chatId, {
      text: `⚠️ @${sender.split('@')[0]} — You are not allowed to tag the bot/owner! ❌`,
      mentions: [sender]
    });
  }
});
