// plugins/antivv.js
const { smd } = require("../lib/smd");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");

// Initialize global anti-VV toggle
global.antivv = global.antivv || {};

// Ensure folder exists
const saveFolder = path.join(__dirname, "../downloads/antivv");
if (!fs.existsSync(saveFolder)) fs.mkdirSync(saveFolder, { recursive: true });

// ===========================
// 🔘 TOGGLE COMMAND
// ===========================
smd({
  pattern: "antivv",
  fromMe: true,
  desc: "Toggle Anti-View-Once ON/OFF per chat",
}, async (ctx) => {
  const chatId = ctx.msg.key.remoteJid;
  const text = (ctx.msg.message?.conversation || "").split(" ")[1]?.toLowerCase();

  global.antivv[chatId] = global.antivv[chatId] || false;

  if (text === "on") {
    global.antivv[chatId] = true;
    await ctx.send("✅ Anti-View-Once is now *ENABLED* for this chat. 🔥");
  } else if (text === "off") {
    global.antivv[chatId] = false;
    await ctx.send("❌ Anti-View-Once is now *DISABLED* for this chat. ⚡");
  } else {
    await ctx.send(
      `⚡ Status: *${global.antivv[chatId] ? "ENABLED ✅" : "DISABLED ❌"}*\nUse *${global.Config.prefix}antivv on/off* to toggle.`
    );
  }
});

// ===========================
// 🔥 LISTENER FUNCTION
// ===========================
module.exports.viewOnceListener = async (sock, msgUpsert) => {
  try {
    const messages = msgUpsert.messages || [];
    for (const msg of messages) {
      const chatId = msg.key.remoteJid;
      if (!global.antivv[chatId]) continue; // OFF kwa chat hii

      const sender = msg.key.participant || chatId;
      const timestamp = new Date().toLocaleString();

      // Detect view-once media
      const viewOnce =
        msg.message?.viewOnceMessageV2 ||
        msg.message?.viewOnceMessage;

      if (!viewOnce) continue;

      const media =
        viewOnce.message?.imageMessage ||
        viewOnce.message?.videoMessage ||
        viewOnce.message?.documentMessage;

      if (!media) continue;

      const type = media.mimetype.split("/")[0]; // image/video/document

      // Download media
      const stream = await downloadContentFromMessage(viewOnce, type);
      const buffer = [];
      for await (const chunk of stream) buffer.push(chunk);
      const mediaBuffer = Buffer.concat(buffer);

      // Save locally
      const ext = type === "image" ? ".jpg" : type === "video" ? ".mp4" : ".data";
      const filename = `${Date.now()}_${sender.split("@")[0]}${ext}`;
      const filepath = path.join(saveFolder, filename);
      fs.writeFileSync(filepath, mediaBuffer);

      // Send media back normally with reaction emoji
      await sock.sendMessage(chatId, {
        [type]: mediaBuffer,
        caption: `⚠️ *View-Once Media Intercepted!* 🔥\n👤 From: @${sender.split("@")[0]}\n🕒 ${timestamp}\n💾 Saved: ${filename}`,
        mentions: [sender],
      });

      console.log(`📸 Anti-VV restored a view-once from ${sender} → saved as ${filename}`);
    }
  } catch (err) {
    console.log("❌ Anti-VV Error:", err);
  }
};
