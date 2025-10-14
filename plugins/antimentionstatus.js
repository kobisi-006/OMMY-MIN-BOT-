const { smd } = require('../lib/smd');
const fs = require('fs');

// 🗂 Local database file
const dbPath = './antimentionstatus-db.json';

// 🔄 Load / Save DB
function loadDB() {
  if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath));
  return {};
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ⚙️ Command to enable/disable Anti Mention
smd({
  pattern: "antimentionstatus",
  fromMe: true,
  desc: "🚫 Toggle Anti-Mention Status (delete + warn + block)"
}, async (message, match, client) => {
  const text = match?.trim()?.toLowerCase();
  const db = loadDB();
  const key = "global";

  if (!db[key]) db[key] = { enabled: false, warns: {} };

  if (text === "on") {
    db[key].enabled = true;
    saveDB(db);
    return await message.reply("✅ *AntiMentionStatus Activated!*\nBot will now delete any status that mentions the bot or owner.");
  } else if (text === "off") {
    db[key].enabled = false;
    saveDB(db);
    return await message.reply("❌ *AntiMentionStatus Deactivated!*");
  }

  await message.reply(`⚙️ *AntiMentionStatus:* ${db[key].enabled ? "ON ✅" : "OFF ❌"}\nUse \`.antimentionstatus on/off\` to change mode.`);
});

// 👁️ Watch for mentions in status updates
smd({
  on: "status-update"
}, async (message, match, client) => {
  const db = loadDB();
  const key = "global";
  if (!db[key] || !db[key].enabled) return;

  const botNumber = client.user?.id || client.user?.jid;
  const ownerNumber = "255760317060@s.whatsapp.net";
  const sender = message.key?.participant || message.key?.remoteJid;
  const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  // 🧩 If status mentions owner or bot
  if (mentionedJids.includes(ownerNumber) || mentionedJids.includes(botNumber)) {
    if (!db[key].warns[sender]) db[key].warns[sender] = 0;
    db[key].warns[sender] += 1;
    const warns = db[key].warns[sender];
    saveDB(db);

    // ⚠️ Send a warning
    await client.sendMessage(sender, {
      text: `⚠️ *Warning ${warns}/3*\nYou mentioned the bot or owner in your status. Please don’t repeat it.`
    });

    // 🗑️ Try deleting that status
    try {
      await client.sendMessage(sender, {
        delete: {
          remoteJid: message.key.remoteJid,
          fromMe: false,
          id: message.key.id,
          participant: sender,
        },
      });
      console.log(`🗑️ Deleted a status mentioning bot/owner from ${sender}`);
    } catch (err) {
      console.error("⚠️ Failed to delete status:", err);
    }

    // ⛔ Block user after 3 warnings
    if (warns >= 3) {
      try {
        await client.updateBlockStatus(sender, "block");
        await client.sendMessage(sender, {
          text: "🚫 You have been blocked for repeatedly mentioning the bot or owner in your statuses."
        });
        delete db[key].warns[sender];
        saveDB(db);
      } catch (err) {
        console.error("❌ Failed to block user:", err);
      }
    }
  }
});
