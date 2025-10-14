const { smd } = require('../lib/smd');
const fs = require('fs');
const dbPath = './antitag-db.json';

smd({
  pattern: "antitag",
  fromMe: true,
  desc: "🛡️ Turn ON/OFF AntiTag system with warn, delete & kick"
}, async (message, match, client) => {
  const chatId = message.jid;
  const text = match?.trim()?.toLowerCase();

  // Load DB or create new
  let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath)) : {};
  if (!db[chatId]) db[chatId] = { enabled: false, warns: {} };

  // Toggle system
  if (text === "on") {
    db[chatId].enabled = true;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return message.reply("✅ *AntiTag system activated!*\n🚫 Anyone tagging the owner/bot will be warned or kicked!");
  } else if (text === "off") {
    db[chatId].enabled = false;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return message.reply("❌ *AntiTag system turned off!*");
  }

  // Show status
  await message.reply(`⚙️ *AntiTag:* ${db[chatId].enabled ? "🟢 ON" : "🔴 OFF"}\nUse *.antitag on/off* to toggle.`);
});


// === AUTO CHECK & ACTION ===
smd({
  on: "message",
}, async (message, _, client) => {
  const chatId = message.jid;
  const ownerNumber = "255624236654@s.whatsapp.net";
  const botNumber = client.user?.id || client.user?.jid;

  if (!fs.existsSync(dbPath)) return;
  const db = JSON.parse(fs.readFileSync(dbPath));
  if (!db[chatId] || !db[chatId].enabled) return;

  const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (!mentions.length) return;

  // If bot or owner is tagged
  if (mentions.includes(ownerNumber) || mentions.includes(botNumber)) {
    const sender = message.sender;
    const senderName = message.pushName || "User";

    // Init warn record
    if (!db[chatId].warns[sender]) db[chatId].warns[sender] = { count: 0, lastWarn: 0 };
    const now = Date.now();

    // Cooldown 10 seconds per warn
    if (now - db[chatId].warns[sender].lastWarn < 10000) return;

    db[chatId].warns[sender].count++;
    db[chatId].warns[sender].lastWarn = now;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    const warns = db[chatId].warns[sender].count;

    // Delete the message
    await client.sendMessage(chatId, { delete: message.key });

    // Stylish warn message
    const warnMsg = `⚠️ *ANTI-TAG ALERT*\n👤 User: @${sender.split('@')[0]}\n📛 Warning: ${warns}/3\n🚫 Reason: Tagging Owner/Bot`;
    await client.sendMessage(chatId, { text: warnMsg, mentions: [sender] });

    // Kick user after 3 warns
    if (warns >= 3) {
      try {
        await client.groupParticipantsUpdate(chatId, [sender], "remove");
        await client.sendMessage(chatId, {
          text: `🔥 *User Removed!*\n@${sender.split('@')[0]} exceeded 3 warnings.`,
          mentions: [sender]
        });
        delete db[chatId].warns[sender];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      } catch (e) {
        await client.sendMessage(chatId, { text: "⚠️ Failed to remove user. Bot must be *admin*!" });
      }
    }
  }
});
