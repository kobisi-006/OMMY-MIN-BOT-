const { smd } = require('../lib/smd');
const axios = require('axios');

const STABILITY_API_KEY = "YOUR_STABILITY_AI_KEY";

smd({
  pattern: 'photo',
  fromMe: false,
  desc: '🎨 Generate a realistic AI image using Stability AI'
}, async (message, args, client) => {
  try {
    const prompt = args.join(" ") || message.message.extendedTextMessage?.text;
    if (!prompt) return await client.sendMessage(message.key.remoteJid, { text: "🖌️ Please provide a prompt!" });

    await client.sendMessage(message.key.remoteJid, { text: "🎨 Generating image..." }, { quoted: message });

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      { prompt, output_format: 'png', aspect_ratio: '1:1', style_preset: 'photographic' },
      { headers: { Authorization: `Bearer ${STABILITY_API_KEY}`, 'Content-Type': 'application/json' }, responseType: 'arraybuffer' }
    );

    const imageBuffer = Buffer.from(response.data, 'binary');
    await client.sendMessage(message.key.remoteJid, { image: imageBuffer, caption: `✅ Prompt: ${prompt}` }, { quoted: message });

  } catch (err) {
    console.error("❌ AI photo error:", err);
    await client.sendMessage(message.key.remoteJid, { text: "❌ Failed to generate image." });
  }
});
