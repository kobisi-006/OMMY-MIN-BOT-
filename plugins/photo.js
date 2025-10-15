const { smd } = require('../lib/smd');
const axios = require('axios');

// === Stability AI Key (direct key) ===
const STABILITY_API_KEY = "sk-GPrKV4TIpQ8DHxH5LNbwi5xEIxyVsu47r2SoZrcLjjZbmGuK";

smd({
  pattern: 'photo',
  fromMe: false,
  desc: '🎨 Generate a realistic AI image using Stability AI'
}, async (message, match, client) => {
  try {
    const prompt = match || message.reply_message?.text;
    if (!prompt)
      return await message.reply('🖌️ *Please provide a prompt!*\nExample: !photo a futuristic city in Africa');

    if (!STABILITY_API_KEY)
      return await message.reply('❌ *Stability AI key missing!*');

    await message.react('🎨'); // reaction while processing

    const response = await axios.post(
      'https://api.stability.ai/v2beta/stable-image/generate/core',
      {
        prompt: prompt,
        output_format: 'png',
        aspect_ratio: '1:1',
        style_preset: 'photographic'
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
      caption: `✅ *AI Image Generated!*\n🎨 Prompt: _${prompt}_\n🤖 Engine: Stability AI`
    }, { quoted: message });

    await message.react('✅');

  } catch (err) {
    console.error('Error generating AI image:', err);
    await message.reply('🚫 *Failed to generate image.* Try again later.');
  }
});
