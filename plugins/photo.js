// plugins/photo.js
const { smd } = require('../lib/smd');
const fetch = require('node-fetch');

const DEEP_AI_KEY = process.env.DEEP_AI_KEY; // lazima iwepo kwenye .env

smd({
  pattern: 'photo',
  fromMe: false,
  desc: 'Generate AI photo/logo using DeepAI'
}, async (message, match, client) => {
  try {
    if (!DEEP_AI_KEY) return await message.send("❌ DeepAI API key not found in .env");

    if (!match) return await message.send("❌ Please provide a prompt for the photo.\nExample: *photo futuristic city*");

    // Call DeepAI text-to-image API
    const response = await fetch('https://api.deepai.org/api/text2img', {
      method: 'POST',
      headers: {
        'Api-Key': DEEP_AI_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        text: match
      })
    });

    const data = await response.json();

    if (!data || !data.output_url) return await message.send("❌ Failed to generate image.");

    // Send generated image
    await client.sendMessage(message.jid, {
      image: { url: data.output_url },
      caption: `✨ Here is your AI-generated image for:\n*${match}*`
    }, { quoted: message });

  } catch (err) {
    console.error("Error in photo command:", err);
    await message.send("❌ Something went wrong while generating the image.");
  }
});
