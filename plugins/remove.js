// plugins/remove.js
const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/remove.json');

// 🔄 Load / Save DB
function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ⚙️ Command to remove participant
smd({
  pattern: 'remove',
  fromMe: true,
  desc: '🚫 Remove a member from group by replying or mentioning'
}, async (message, match, client) => {
  try {
    const chatId = message.jid;
    const db = loadDB();

    // Only in groups
    if (!chatId.endsWith('@g.us'))
      return await message.reply("❌ This command can only be used in groups!");

    // Get mentioned or replied user
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let target = mentioned[0];

    if (!target && message.reply_message) {
      target = message.reply_message.sender;
    }

    if (!target)
      return await message.reply("⚠️ Reply to a member or mention them to remove.");

    // Ignore bot owner
    const ownerNumber = "255624236654@s.whatsapp.net";
    if (target === ownerNumber) return await message.reply("❌ You cannot remove the bot owner!");

    // Attempt to remove
    await client.groupParticipantsUpdate(chatId, [target], 'remove');
    await message.reply(`🚫 @${target.split('@')[0]} has been removed from the group!`, { mentions: [target] });

    // Optional: track remove attempts
    if (!db[chatId]) db[chatId] = {};
    db[chatId][target] = (db[chatId][target] || 0) + 1;
    saveDB(db);

  } catch (err) {
    console.error("Remove command error:", err);
    await message.reply("⚠️ Failed to remove member. Make sure bot is admin.");
  }
});
