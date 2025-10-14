// plugins/photo.js
const { smd } = require('../lib/smd');
const axios = require('axios');

smd({
  pattern: 'photo',
  fromMe: false,
  desc: '🎨 Generate high-quality AI image from text (DeepAI)'
}, async (message, match, client) => {
  try {
    const DEEPAI_KEY = process.env.DEEPAI_KEY;
    if (!DEEPAI_KEY) return await message.send("⚠️ Missing *DEEPAI_KEY* in your .env file!");

    if (!match) {
      return await message.send("🖌️ Please write a prompt.\nExample: *photo a cyberpunk lion wearing sunglasses*");
    }

    const startTime = Date.now();
    await message.send("⏳ Generating your image, please wait...");

    // Call DeepAI API
    const response = await axios.post(
      "https://api.deepai.org/api/text2img",
      { text: match },
      { headers: { 'api-key': DEEPAI_KEY } }
    );

    const img = response.data?.output_url;
    if (!img) return await message.send("❌ Failed to generate image, please try again.");

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    const botName = "🤖 Ben Whittaker Tech";
    const caption = `
🖼️ *AI Image Generated*
💡 Prompt: *${match}*
⚙️ Engine: DeepAI Text2Img
⏱️ Time: ${duration}s
👨‍💻 Bot: ${botName}
    `.trim();

    await client.sendMessage(message.jid, {
      image: { url: img },
      caption
    }, { quoted: message });

  } catch (err) {
    console.error("❌ Error in photo command:", err);
    await message.send("🚫 Something went wrong while generating the image. Try again.");
  }
});
