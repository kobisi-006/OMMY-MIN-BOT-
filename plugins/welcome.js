// plugins/welcome.js
const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../db/welcome.json');

// 🔄 Load / Save DB
function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

smd({
  pattern: 'welcome',
  fromMe: true,
  desc: '👋 Enable or disable welcome messages in this group'
}, async (message, match, client) => {
  const chatId = message.jid;
  const text = match?.trim()?.toLowerCase();
  const db = loadDB();

  if (!db[chatId]) db[chatId] = { enabled: false };

  if (text === 'on') {
    db[chatId].enabled = true;
    saveDB(db);
    return await message.reply("✅ Welcome messages are now *ENABLED* for this group!");
  } else if (text === 'off') {
    db[chatId].enabled = false;
    saveDB(db);
    return await message.reply("❌ Welcome messages are now *DISABLED* for this group!");
  }

  await message.reply(`⚙️ Welcome status: ${db[chatId].enabled ? "ON ✅" : "OFF ❌"}\nUse *.welcome on/off* to toggle.`);
});

// 🛡️ Listener for new participants
smd({
  on: 'participants.update'
}, async (update, match, client) => {
  const chatId = update.id;
  const db = loadDB();
  if (!db[chatId]?.enabled) return;

  for (let p of update.participants) {
    if (update.action === 'add') {
      const text = `
╭─✦ Welcome ✦─╮
👋 Hello @${p.split('@')[0]}!
🏷️ Group: ${update.subject || "this group"}
✨ Enjoy your stay and follow the rules!
╰─────────────╯
💡 *OMMY-MIN-BOT*`;

      await client.sendMessage(chatId, { text, mentions: [p] });
    }
  }
});
