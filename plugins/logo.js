// plugins/logo.js
const { smd } = require('../lib/smd');
const fetch = require('node-fetch');

const DEEP_AI_KEY = process.env.DEEP_AI_KEY; // API key yako lazima iwepo

smd({
  pattern: 'logo',
  fromMe: false,
  desc: 'Generate AI Logo using DeepAI'
}, async (message, match, client) => {
  try {
    if (!DEEP_AI_KEY) return await message.send("❌ DeepAI API key not found in .env");

    if (!match) return await message.send("❌ Please provide a prompt for the logo.\nExample: *logo futuristic tech company*");

    // DeepAI Text-to-Image API call
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

    if (!data || !data.output_url) return await message.send("❌ Failed to generate logo.");

    // Send generated logo
    await client.sendMessage(message.jid, {
      image: { url: data.output_url },
      caption: `✨ Here is your AI-generated logo for:\n*${match}*`
    }, { quoted: message });

  } catch (err) {
    console.error("Error in logo command:", err);
    await message.send("❌ Something went wrong while generating the logo.");
  }
});
