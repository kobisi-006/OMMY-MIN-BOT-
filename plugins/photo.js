// plugins/photo.js
const { smd } = require('../lib/smd');
const axios = require('axios');

const STABILITY_API_KEY = "YOUR_STABILITY_API_KEY_HERE"; // weka key yako hapa

smd({
  pattern: "photo",
  fromMe: false,
  desc: "🎨 Generate realistic AI image using Stability AI"
}, async (message, match, client) => {
  try {
    const prompt = match || message.reply_message?.text;
    if (!prompt)
      return await message.reply('🖌️ Please provide a prompt!\nExample: *!photo a futuristic city in Africa*');

    if (!STABILITY_API_KEY)
      return await message.reply('❌ Stability AI key missing!');

    await message.react('🎨');

    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image',
      {
        text_prompts: [{ text: prompt }],
        cfg_scale: 7,
        clip_guidance_preset: "FAST_BLUE",
        height: 512,
        width: 512,
        samples: 1,
        steps: 30
      },
      {
        headers: {
          'Authorization': `Bearer ${STABILITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const imageBuffer = Buffer.from(response.data, 'binary');
    await client.sendMessage(message.jid, {
      image: imageBuffer,
      caption: `✅ AI Image Generated!\n🎨 Prompt: _${prompt}_\n🤖 Engine: Stability AI`
    }, { quoted: message });

    await message.react('✅');

  } catch (err) {
    console.error('❌ Photo command error:', err.response?.data || err.message || err);
    await message.reply('🚫 Failed to generate image. Make sure your Stability AI key is valid and try again.');
  }
});
