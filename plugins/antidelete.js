// plugins/antidelete.js
const { smd } = require("../index"); // adjust path

global.antidelete = global.antidelete || {};

// Toggle command
smd({
  pattern: "antidelete",
  fromMe: true,
  desc: "🔒 Toggle Anti-Delete ON/OFF for this chat",
}, async (ctx) => {
  const chatId = ctx.msg.key.remoteJid;
  const text = (ctx.msg.message?.conversation || "").toLowerCase().split(" ")[1] || "";

  global.antidelete[chatId] = global.antidelete[chatId] || false;

  if (text === "on") {
    global.antidelete[chatId] = true;
    await ctx.send(`✅ Anti-Delete is now *ENABLED* in this chat.`);
  } else if (text === "off") {
    global.antidelete[chatId] = false;
    await ctx.send(`❌ Anti-Delete is now *DISABLED* in this chat.`);
  } else {
    await ctx.send(
      `⚡ Anti-Delete Status: *${global.antidelete[chatId] ? "ENABLED ✅" : "DISABLED ❌"}*\nUse: *${global.Config.prefix}antidelete on/off*`
    );
  }
});

// ===============================
// 🔥 Listener for deleted messages
// ===============================
module.exports.msgDeleteListener = async (sock, msgUpsert) => {
  try {
    const messages = msgUpsert.messages || [];
    for (const msg of messages) {
      if (!msg.message?.protocolMessage) continue;
      const protocolMsg = msg.message.protocolMessage;

      // Only handle revoke type (deleted messages)
      if (protocolMsg.type !== 0 && protocolMsg.protocolMessageType !== "REVOKE") continue;

      const chatId = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;

      if (!global.antidelete[chatId]) continue;

      const time = new Date().toLocaleString();
      const infoText = `⚠️ *Message deleted by* @${sender.split("@")[0]}\n🕒 *Time:* ${time}`;

      // Send deleted message info
      await sock.sendMessage(chatId, { text: infoText, mentions: [sender] });
    }
  } catch (err) {
    console.log("❌ Anti-Delete Error:", err);
  }
};
