// plugins/logo.js
const { smd } = require('../lib/smd');
const fetch = require('node-fetch');

const DEEP_AI_KEY = process.env.DEEP_AI_KEY; // lazima iwepo kwenye .env

smd({
  pattern: "logo",
  fromMe: false,
  desc: "🎨 Generate stylish AI logos with progress reactions and thumbnail preview"
}, async (message, match, client) => {
  try {
    if (!DEEP_AI_KEY)
      return await message.reply("⚠️ *Missing API Key!*\nAdd `DEEP_AI_KEY=your_api_key` in `.env`.");

    const prompt = match?.trim();
    if (!prompt)
      return await message.reply("🖋️ Please provide a text prompt.\nExample: *logo futuristic tech company*");

    // ⏳ React processing
    await message.react("⌛");
    await message.reply("🧠 Generating your AI logo... Please wait 5–10 seconds.");

    // --- DeepAI API ---
    let data;
    try {
      const res = await fetch("https://api.deepai.org/api/text2img", {
        method: "POST",
        headers: {
          "Api-Key": DEEP_AI_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({ text: prompt })
      });
      data = await res.json();
    } catch (e) {
      console.error("DeepAI request failed:", e);
    }

    // --- Fallback Stable Diffusion if DeepAI fails ---
    if (!data?.output_url) {
      try {
        const res2 = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HF_API_KEY || ""}` // optional HuggingFace key
          },
          body: JSON.stringify({ inputs: prompt })
        });
        const blob = await res2.blob();
        const buffer = await blob.arrayBuffer();
        const base64Image = Buffer.from(buffer).toString("base64");

        // Thumbnail preview
        await client.sendMessage(message.jid, {
          image: Buffer.from(base64Image, "base64"),
          caption: `✨ *AI Generated Logo (Stable Diffusion)*\n🧩 Prompt: ${prompt}`
        }, { quoted: message });

        await message.react("✅");
        return;
      } catch (fallbackErr) {
        console.error("Stable Diffusion fallback failed:", fallbackErr);
      }
    }

    // --- Send result if DeepAI succeeded ---
    if (data?.output_url) {
      await client.sendMessage(message.jid, {
        image: { url: data.output_url },
        caption: `🎨 *AI Generated Logo*\n🧠 Prompt: ${prompt}\n✨ Powered by *DeepAI*`
      }, { quoted: message });
      await message.react("✅");
    } else {
      await message.reply("❌ Sorry, I couldn’t generate a logo this time. Try again later.");
    }

  } catch (err) {
    console.error("Logo command error:", err);
    await message.reply("⚠️ An unexpected error occurred while generating the logo.");
  }
});
