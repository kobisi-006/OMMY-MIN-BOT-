const { smd } = require('../lib/smd');

smd({
  pattern: "antitag",
  fromMe: true,
  desc: "🚫 Turn ON/OFF AntiTag system with auto warn, delete, and kick."
}, async (message, match, client) => {
  const chatId = message.jid;
  const text = match?.trim()?.toLowerCase();
  const dbPath = './antitag-db.json';
  const fs = require('fs');

  // ✅ Load or create database
  let db = {};
  if (fs.existsSync(dbPath)) {
    db = JSON.parse(fs.readFileSync(dbPath));
  }

  // ✅ Initialize group record if missing
  if (!db[chatId]) db[chatId] = { enabled: false, warns: {} };

  // ✅ Toggle system
  if (text === "on") {
    db[chatId].enabled = true;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return await message.reply("✅ *AntiTag system activated!* 🚨\nAnyone tagging the owner or bot will be warned, kicked, and message deleted.");
  } else if (text === "off") {
    db[chatId].enabled = false;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
    return await message.reply("❌ *AntiTag system deactivated!* 📴");
  }

  // ✅ Show current status
  await message.reply(`⚙️ *AntiTag:* ${db[chatId].enabled ? "ON ✅" : "OFF ❌"}\nUse \`.antitag on/off\` to toggle.`);
});

// 🛡️ Auto Detection & Action
smd({
  on: "message",
}, async (message, match, client) => {
  const chatId = message.jid;
  const dbPath = './antitag-db.json';
  const fs = require('fs');

  // ✅ Load database
  if (!fs.existsSync(dbPath)) return;
  const db = JSON.parse(fs.readFileSync(dbPath));
  if (!db[chatId] || !db[chatId].enabled) return;

  // ✅ Define owner JID
  const ownerNumber = "255624236654@s.whatsapp.net";
  const botNumber = client.user?.id || client.user?.jid;

  // ✅ Detect tags (mentions)
  const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

  if (mentions.includes(ownerNumber) || mentions.includes(botNumber)) {
    const sender = message.sender;
    const groupMetadata = await client.groupMetadata(chatId);
    const senderName = message.pushName || "User";

    if (!db[chatId].warns[sender]) db[chatId].warns[sender] = 0;
    db[chatId].warns[sender] += 1;

    const warns = db[chatId].warns[sender];
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    // ✅ Delete message
    await client.sendMessage(chatId, { delete: message.key });

    // ✅ Send warning message
    await client.sendMessage(chatId, {
      text: `⚠️ *Warning ${warns}/3* for @${sender.split('@')[0]} — do not tag the owner/bot!`,
      mentions: [sender]
    });

    // ✅ Kick after 3 warnings
    if (warns >= 3) {
      try {
        await client.groupParticipantsUpdate(chatId, [sender], "remove");
        await client.sendMessage(chatId, { text: `🚨 @${sender.split('@')[0]} has been *removed* after 3 warnings!`, mentions: [sender] });
        delete db[chatId].warns[sender];
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
      } catch {
        await client.sendMessage(chatId, { text: "⚠️ Failed to kick user. Ensure bot is admin." });
      }
    }
  }
});
