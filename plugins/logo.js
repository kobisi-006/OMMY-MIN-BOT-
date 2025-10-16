const { smd } = require("../index");
const axios = require("axios");

const DEEP_AI_KEY = "5bfeb575-9bb2-4847-acf4-f32d0d3d713a"; // DeepAI API Key

smd({
  pattern: "logo",
  fromMe: false,
  desc: "Generate a logo using DeepAI",
}, async (msg, args, client) => {
  const prompt = args.join(" ");
  if (!prompt) return msg.reply("❌ Tafadhali andika jina/idea ya logo. \nUsage: *logo <text>");

  await msg.react("🎨");
  await msg.send("🎨 Generating your logo...");

  try {
    const response = await axios.post(
      "https://api.deepai.org/api/text2img",
      { text: prompt },
      { headers: { "api-key": DEEP_AI_KEY } }
    );

    const imageUrl = response.data.output_url;
    if (!imageUrl) return msg.reply("❌ Logo generation failed!");

    await client.sendMessage(msg.key.remoteJid, {
      image: { url: imageUrl },
      caption: `🎨 Logo generated for: ${prompt}`
    }, { quoted: msg });

  } catch (err) {
    console.error(err);
    await msg.reply("❌ Error generating logo. Maybe DeepAI API limit reached or key invalid.");
  }
});
