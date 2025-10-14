const { smd } = require('../lib/smd');
const fs = require('fs');

// 📂 Local database file
const dbPath = './antimentionstatus-db.json';

// 🔄 DB helpers
function loadDB() {
  return fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// ⚙️ Command: Toggle AntiMentionStatus
smd({
  pattern: "antimentionstatus",
  fromMe: true,
  desc: "🚫 Toggle AntiMentionStatus (Delete + Warn + Block)"
}, async (message, match, client) => {
  const db = loadDB();
  const key = "global";
  const text = match?.trim()?.toLowerCase();

  if (!db[key]) db[key] = { enabled: false, warns: {}, lastWarnTime: {} };

  if (text === "on") {
    db[key].enabled = true;
    saveDB(db);
    return await message.reply("✅ *AntiMentionStatus Activated!*\n\n🛡️ Bot will delete and warn users who mention the owner/bot in status updates.");
  } else if (text === "off") {
    db[key].enabled = false;
    saveDB(db);
    return await message.reply("❌ *AntiMentionStatus Deactivated!*");
  }

  await message.reply(`⚙️ *AntiMentionStatus:* ${db[key].enabled ? "🟢 ON" : "🔴 OFF"}\nUse *.antimentionstatus on/off* to toggle.`);
});

// 👁️ Listen for status updates
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

  // 🚨 Detect mention of bot or owner in status
  if (mentionedJids.includes(ownerNumber) || mentionedJids.includes(botNumber)) {
    const now = Date.now();
    if (!db[key].warns[sender]) db[key].warns[sender] = 0;
    if (!db[key].lastWarnTime[sender]) db[key].lastWarnTime[sender] = 0;

    // 🕒 Cooldown (10 seconds between warnings)
    if (now - db[key].lastWarnTime[sender] < 10000) return;

    db[key].warns[sender] += 1;
    db[key].lastWarnTime[sender] = now;
    saveDB(db);

    const warns = db[key].warns[sender];

    // 🗑️ Attempt to delete the status
    try {
      await client.sendMessage(sender, {
        delete: {
          remoteJid: message.key.remoteJid,
          id: message.key.id,
          participant: sender,
        },
      });
      console.log(`🧹 Deleted status mentioning bot/owner from ${sender}`);
    } catch (err) {
      console.error("⚠️ Failed to delete status:", err.message);
    }

    // ⚠️ Send warning message
    await client.sendMessage(sender, {
      text: `⚠️ *Warning ${warns}/3*\n🚫 Do not mention the *bot or owner* in your status!\nNext time, you will be blocked.`,
    });

    // 🔥 Log to owner’s inbox
    await client.sendMessage(ownerNumber, {
      text: `🚨 *AntiMention Alert*\n👤 User: wa.me/${sender.split('@')[0]}\n⚠️ Warning: ${warns}/3\n📸 Action: Status deleted.`,
    });

    // ⛔ Block after 3 warnings
    if (warns >= 3) {
      try {
        await client.updateBlockStatus(sender, "block");
        await client.sendMessage(sender, {
          text: "🚫 *You have been blocked permanently!*\nReason: Repeatedly mentioning the bot/owner in your status.",
        });
        delete db[key].warns[sender];
        delete db[key].lastWarnTime[sender];
        saveDB(db);

        await client.sendMessage(ownerNumber, {
          text: `🚫 *User Blocked Automatically!*\n👤 wa.me/${sender.split('@')[0]}\nReason: 3x status mentions.`,
        });
      } catch (err) {
        console.error("❌ Failed to block user:", err.message);
      }
    }
  }
});
