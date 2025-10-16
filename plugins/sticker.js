// plugins/sticker.js
const { writeFileSync, unlinkSync } = require("fs");
const { spawn } = require("child_process");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const path = require("path");
const { smd } = require("../index"); // au ../lib/smd kulingana na structure yako

smd({
  pattern: "sticker",
  fromMe: false,
  desc: "😂 Convert image/video reply to sticker",
}, async (msg, args, client) => {
  try {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted?.imageMessage && !quoted?.videoMessage) {
      return msg.send("⚠️ Reply image/video with *sticker*");
    }

    const mediaType = quoted.imageMessage ? "image" : "video";
    const stream = await downloadContentFromMessage(quoted[mediaType + "Message"], mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

    const filePath = path.join(__dirname, `temp.${mediaType === "image" ? "jpg" : "mp4"}`);
    writeFileSync(filePath, buffer);

    const outputPath = path.join(__dirname, "sticker.webp");
    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", filePath,
        "-vf", "scale=512:512:force_original_aspect_ratio=decrease",
        "-y", outputPath
      ]);
      ffmpeg.on("close", resolve);
      ffmpeg.on("error", reject);
    });

    await client.sendMessage(msg.key.remoteJid, {
      sticker: { url: outputPath },
      caption: "🏷️ OMMY-MD 💥"
    });

    unlinkSync(filePath);
    unlinkSync(outputPath);

  } catch (err) {
    console.error("❌ Sticker command error:", err);
    await msg.send("❌ Failed to create sticker. Make sure ffmpeg is installed and try again.");
  }
});
