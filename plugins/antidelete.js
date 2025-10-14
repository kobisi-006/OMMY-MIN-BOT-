const { smd } = require("../index"); // hakikisha hii inalingana na file kuu lako (index.js)

// Global store
global.antidelete = global.antidelete || {};
global.deletedMessages = global.deletedMessages || {};

smd(
  {
    pattern: "antidelete",
    fromMe: true,
    desc: "🔒 Toggle Anti-Delete ON/OFF for this chat",
  },
  async (ctx) => {
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
        `⚡ Anti-Delete Status: *${global.antidelete[chatId] ? "ENABLED ✅" : "DISABLED ❌"}*\n\nUse:\n*${global.Config.prefix}antidelete on* or *off*`
      );
    }
  }
);

// ===============================
// 🔥 Message Delete Listener
// ===============================
module.exports.msgDeleteListener = async (sock, msg) => {
  try {
    if (!msg.message?.protocolMessage) return;

    const chatId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!global.antidelete[chatId]) return; // anti-delete off for this chat

    const deletedMsg = msg.message.protocolMessage;
    const deletedId = deletedMsg.key?.id;
    if (!deletedId) return;

    const deletedType = deletedMsg.protocolMessageType;
    const time = new Date().toLocaleString();

    const infoText = `⚠️ *Message deleted by* @${sender.split("@")[0]}\n🕒 *Time:* ${time}\n🔹 *Type:* ${deletedType}`;

    await sock.sendMessage(chatId, { text: infoText, mentions: [sender] });

  } catch (err) {
    console.log("❌ Anti-Delete Error:", err);
  }
};
