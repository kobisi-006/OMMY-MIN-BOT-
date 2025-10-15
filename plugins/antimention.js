// plugins/antimention.js
const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/antimention.json');

// 🔄 Load / Save DB
function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ⚙️ Command to toggle Anti-Mention
smd({
  pattern: 'antimention',
  fromMe: true,
  desc: '❌ Enable/Disable Anti-Mention for this group'
}, async (message, match, client) => {
  const chatId = message.jid;
  const text = match?.trim()?.toLowerCase();
  const db = loadDB();

  if (!db[chatId]) db[chatId] = { enabled: false };

  if (text === 'on') {
    db[chatId].enabled = true;
    saveDB(db);
    return await message.reply("✅ Anti-Mention is now *ENABLED* for this group! 👀");
  } else if (text === 'off') {
    db[chatId].enabled = false;
    saveDB(db);
    return await message.reply("❌ Anti-Mention is now *DISABLED* for this group! 🙌");
  }

  await message.reply(`⚙️ Anti-Mention status: ${db[chatId].enabled ? "ON ✅" : "OFF ❌"}\nUse *.antimention on/off* to toggle.`);
});

// 🛡️ Listener to block mentions
smd({
  on: 'message'
}, async (message, match, client) => {
  const chatId = message.jid;
  const db = loadDB();
  if (!db[chatId]?.enabled) return;

  const text =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text;
  if (!text) return;

  // ⚠️ Check mentions
  const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (!mentions.length) return;

  const sender = message.sender;
  const botNumber = client.user?.id || client.user?.jid;

  // 🛑 Ignore bot owner
  const ownerNumber = "255624236654@s.whatsapp.net"; // Badilisha na number yako
  if ([ownerNumber, botNumber].includes(sender)) return;

  // ❌ Delete the message if it mentions anyone
  try {
    await client.sendMessage(chatId, { delete: message.key });
  } catch {}

  // ⚠️ Send warning with emoji reaction
  await client.sendMessage(chatId, {
    text: `⚠️ @${sender.split('@')[0]} — Mentions are not allowed in this group!\n🚨 Please avoid tagging members!`,
    mentions: [sender]
  });
});
