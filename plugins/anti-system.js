const { smd } = require('../lib/smd'); // Badilisha path ikiwa inabidi
const fs = require('fs');
const path = './anti-systems-db.json';

// ======== DB HELPERS ========
function loadDB() {
  return fs.existsSync(path) ? JSON.parse(fs.readFileSync(path)) : {};
}
function saveDB(db) {
  fs.writeFileSync(path, JSON.stringify(db, null, 2));
}

// ======== COMMANDS ========

// --------- AntiTag ---------
smd({
  pattern: 'antitag',
  fromMe: true,
  desc: '🚫 Toggle AntiTag ON/OFF (warn/delete/kick)'
}, async (ctx) => {
  const chatId = ctx.msg.key.remoteJid;
  const db = loadDB();
  if (!db[chatId]) db[chatId] = { antitag: false, warns: {} };

  const text = (ctx.msg.message?.conversation || "").split(" ")[1]?.toLowerCase();
  if (text === "on") {
    db[chatId].antitag = true;
    saveDB(db);
    return await ctx.send("✅ AntiTag enabled for this chat!");
  } else if (text === "off") {
    db[chatId].antitag = false;
    saveDB(db);
    return await ctx.send("❌ AntiTag disabled!");
  } else {
    return await ctx.send(`⚙️ AntiTag Status: ${db[chatId].antitag ? "ON ✅" : "OFF ❌"}\nUse *.antitag on/off*`);
  }
});

// --------- AntiMention ---------
smd({
  pattern: 'antimention',
  fromMe: true,
  desc: '🚫 Toggle AntiMention ON/OFF (warn/delete/kick)'
}, async (ctx) => {
  const chatId = ctx.msg.key.remoteJid;
  const db = loadDB();
  if (!db[chatId]) db[chatId] = { antimention: false, warns: {} };

  const text = (ctx.msg.message?.conversation || "").split(" ")[1]?.toLowerCase();
  if (text === "on") {
    db[chatId].antimention = true;
    saveDB(db);
    return await ctx.send("✅ AntiMention enabled!");
  } else if (text === "off") {
    db[chatId].antimention = false;
    saveDB(db);
    return await ctx.send("❌ AntiMention disabled!");
  } else {
    return await ctx.send(`⚙️ AntiMention Status: ${db[chatId].antimention ? "ON ✅" : "OFF ❌"}\nUse *.antimention on/off*`);
  }
});

// --------- AntiDelete ---------
global.antidelete = global.antidelete || {};
smd({
  pattern: 'antidelete',
  fromMe: true,
  desc: '🔒 Toggle AntiDelete ON/OFF'
}, async (ctx) => {
  const chatId = ctx.msg.key.remoteJid;
  const text = (ctx.msg.message?.conversation || "").split(" ")[1]?.toLowerCase();

  global.antidelete[chatId] = global.antidelete[chatId] || false;
  if (text === "on") global.antidelete[chatId] = true;
  else if (text === "off") global.antidelete[chatId] = false;

  await ctx.send(`⚡ AntiDelete: ${global.antidelete[chatId] ? "ENABLED ✅" : "DISABLED ❌"}\nUse *.antidelete on/off*`);
});

// --------- AntiViewOnce ---------
global.antivv = global.antivv || {};
smd({
  pattern: 'antivv',
  fromMe: true,
  desc: '🛡️ Toggle AntiViewOnce ON/OFF'
}, async (ctx) => {
  const chatId = ctx.msg.key.remoteJid;
  const text = (ctx.msg.message?.conversation || "").split(" ")[1]?.toLowerCase();

  global.antivv[chatId] = global.antivv[chatId] || false;
  if (text === "on") global.antivv[chatId] = true;
  else if (text === "off") global.antivv[chatId] = false;

  await ctx.send(`⚡ AntiViewOnce: ${global.antivv[chatId] ? "ENABLED ✅" : "DISABLED ❌"}\nUse *.antivv on/off*`);
});

// ======== LISTENERS ========
module.exports.listeners = async (sock, msgUpsert) => {
  const messages = msgUpsert.messages || [];
  const owner = '255760317060@s.whatsapp.net';
  const bot = sock.user?.id || sock.user?.jid;
  const db = loadDB();

  for (const msg of messages) {
    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || chatId;

    const message = msg.message;
    if (!message) continue;

    // --- AntiTag ---
    if (db[chatId]?.antitag) {
      const mentions = message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.includes(owner) || mentions.includes(bot)) {
        // Delete + warn
        try { await sock.sendMessage(chatId, { delete: msg.key }); } catch(e){}
        db[chatId].warns[sender] = (db[chatId].warns[sender] || 0) + 1;
        saveDB(db);
        await sock.sendMessage(chatId, { text: `⚠️ Warning ${db[chatId].warns[sender]}/3\nDo not tag owner/bot!`, mentions: [sender] });

        if (db[chatId].warns[sender] >= 3) {
          try { await sock.groupParticipantsUpdate(chatId, [sender], "remove"); delete db[chatId].warns[sender]; saveDB(db); } catch(e){}
        }
      }
    }

    // --- AntiMention ---
    if (db[chatId]?.antimention) {
      const mentions = message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentions.includes(owner) || mentions.includes(bot)) {
        db[chatId].warns[sender] = (db[chatId].warns[sender] || 0) + 1;
        saveDB(db);
        await sock.sendMessage(chatId, { text: `⚠️ Warning ${db[chatId].warns[sender]}/3\nDo not mention owner/bot!`, mentions: [sender] });
        if (db[chatId].warns[sender] >= 3) {
          try { await sock.groupParticipantsUpdate(chatId, [sender], "remove"); delete db[chatId].warns[sender]; saveDB(db); } catch(e){}
        }
      }
    }

    // --- AntiDelete ---
    if (global.antidelete[chatId] && message.protocolMessage?.protocolMessageType === 0) {
      const time = new Date().toLocaleString();
      await sock.sendMessage(chatId, { text: `⚠️ User @${sender.split('@')[0]} deleted a message at ${time}`, mentions: [sender] });
    }

    // --- AntiViewOnce ---
    const vv =
      message.viewOnceMessageV2 ||
      message.viewOnceMessageV2Extension ||
      message.viewOnceMessage;
    if (global.antivv[chatId] && vv) {
      const content = vv.message?.imageMessage || vv.message?.videoMessage || vv.message?.documentMessage;
      if (content?.url) {
        const type = content.mimetype?.startsWith("video") ? "video" : content.mimetype?.startsWith("image") ? "image" : "document";
        const caption = `⚠️ View-Once media restored from @${sender.split('@')[0]}`;
        await sock.sendMessage(chatId, { [type]: { url: content.url }, caption, mentions: [sender] }, { quoted: msg });
      }
    }
  }
};
