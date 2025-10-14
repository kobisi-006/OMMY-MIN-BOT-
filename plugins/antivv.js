const { smd } = require("../index"); // badilisha path ikibidi

// Global store for chat settings
global.antivv = global.antivv || {};

// ===========================
// 🔘 TOGGLE COMMAND
// ===========================
smd(
  {
    pattern: "antivv",
    fromMe: true,
    desc: "Toggle Anti-View-Once ON/OFF per chat",
  },
  async (ctx) => {
    const chatId = ctx.msg.key.remoteJid;
    const text = (ctx.msg.message?.conversation || "")
      .split(" ")[1]
      ?.toLowerCase();

    global.antivv[chatId] = global.antivv[chatId] || false;

    if (text === "on") {
      global.antivv[chatId] = true;
      await ctx.send("✅ Anti-View-Once is now *ENABLED* for this chat.");
    } else if (text === "off") {
      global.antivv[chatId] = false;
      await ctx.send("❌ Anti-View-Once is now *DISABLED* for this chat.");
    } else {
      await ctx.send(
        `⚡ Status: *${
          global.antivv[chatId] ? "ENABLED ✅" : "DISABLED ❌"
        }*\nUse *${global.Config.prefix}antivv on/off* to toggle.`
      );
    }
  }
);

// ===========================
// 🔥 LISTENER FUNCTION
// ===========================
module.exports.viewOnceListener = async (sock, msgUpsert) => {
  try {
    const messages = msgUpsert.messages || [];
    for (const msg of messages) {
      const chatId = msg.key.remoteJid;
      if (!global.antivv[chatId]) continue; // off kwa chat hii

      const message = msg.message;
      if (!message) continue;

      const sender = msg.key.participant || chatId;
      const timestamp = new Date().toLocaleString();

      // Detect ViewOnce media
      const viewOnce =
        message?.viewOnceMessageV2 ||
        message?.viewOnceMessageV2Extension ||
        message?.viewOnceMessage;

      if (!viewOnce) continue;

      const content =
        viewOnce.message?.imageMessage ||
        viewOnce.message?.videoMessage ||
        viewOnce.message?.documentMessage;

      if (!content) continue;

      const caption = `⚠️ *View-Once Media Intercepted!*\n👤 From: @${sender.split(
        "@"
      )[0]}\n🕒 Time: ${timestamp}`;

      // === Send media back normally ===
      if (content.url) {
        const type = content.mimetype?.startsWith("video")
          ? "video"
          : content.mimetype?.startsWith("image")
          ? "image"
          : "document";

        await sock.sendMessage(
          chatId,
          {
            [type]: { url: content.url },
            caption,
            mentions: [sender],
          },
          { quoted: msg }
        );
      }

      console.log(`📸 Anti-VV restored a view-once from ${sender}`);
    }
  } catch (err) {
    console.log("❌ Anti-VV Error:", err);
  }
};
