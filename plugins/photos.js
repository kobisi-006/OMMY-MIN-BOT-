// plugins/photo.js
const { smd } = require('../lib/smd');
const axios = require('axios');

// DeepAI API Key (private bot)
const DEEPAI_KEY = "5bfeb575-9bb2-4847-acf4-f32d0d3d713a";

smd({
  pattern: 'photo',
  fromMe: false,
  desc: 'Generate an AI image from a prompt automatically'
}, async (message, match, client) => {
  try {
    if (!match) return await message.send("❌ Please provide a description. Example:\n*photo sunset on the beach*");

    // Notify user
    await message.send("🖌️ Generating image, please wait...");

    // DeepAI API request
    const response = await axios.post(
      'https://api.deepai.org/api/text2img',
      { text: match },
      { headers: { 'api-key': DEEPAI_KEY } }
    );

    if (!response.data || !response.data.output_url) 
      return await message.send("❌ Failed to generate image");

    // Send generated image
    await client.sendMessage(message.jid, {
      image: { url: response.data.output_url },
      caption: `✅ Image generated for: *${match}*`
    }, { quoted: message });

  } catch (err) {
    console.error("Error in photo command:", err);
    await message.send("❌ Something went wrong while generating the image.");
  }
});
