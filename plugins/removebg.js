// plugins/removebg.js
const { smd } = require('../lib/smd');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

smd({
  pattern: "removebg",
  fromMe: false,
  desc: "Remove background from image automatically"
}, async (msg, match, sock) => {
  try {
    if (!msg.quoted || !msg.quoted.imageMessage) {
      return await msg.reply("📸 *Please reply to an image to remove its background.*");
    }

    // === Download quoted image ===
    const buffer = await sock.downloadMediaMessage(msg.quoted);
    const tempFile = path.join(__dirname, "../temp/input.png");
    fs.writeFileSync(tempFile, buffer);

    const form = new FormData();
    form.append("image_file", fs.createReadStream(tempFile));
    form.append("size", "auto");

    const REMOVE_BG_API = "MUBrw5bSb2jiakasY3x3QzGb"; // ← API KEY yako

    const response = await axios.post("https://api.remove.bg/v1.0/removebg", form, {
      headers: {
        ...form.getHeaders(),
        "X-Api-Key": REMOVE_BG_API,
      },
      responseType: "arraybuffer"
    });

    const outputFile = path.join(__dirname, "../temp/output.png");
    fs.writeFileSync(outputFile, response.data);

    await sock.sendMessage(msg.key.remoteJid, {
      image: fs.readFileSync(outputFile),
      caption: "✅ *Background removed successfully!*"
    }, { quoted: msg });

    fs.unlinkSync(tempFile);
    fs.unlinkSync(outputFile);

  } catch (err) {
    console.error("Error in removebg command:", err);
    await msg.reply("❌ *Failed to remove background.*\nPlease check your API key or try again.");
  }
});
