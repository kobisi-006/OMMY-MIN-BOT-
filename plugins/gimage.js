// plugins/gimage.js
const axios = require("axios");
const { smd } = require("../index"); // au ../lib/smd kulingana na structure yako

smd({
  pattern: "gimage",
  fromMe: false,
  desc: "🖼 Search and send image from Google",
}, async (msg, args, client) => {
  if (!args.length) return msg.send("🖼 Taja kitu cha kutafuta!\nMfano: *gimage Ronaldo*");

  const query = args.join(" ");
  try {
    await msg.react("🔎"); // processing

    const res = await axios.get("https://serpapi.com/search.json", {
      params: {
        q: query,
        tbm: "isch",
        api_key: "6084018373e1103ad98c592849e59eb1f0abf4a5996841a2ba78a6c9c70c9058"
      }
    });

    if (!res.data.images_results?.length) {
      return msg.send("😔 Hakuna picha!");
    }

    const img = res.data.images_results[0].original;

    await client.sendMessage(msg.key.remoteJid, {
      image: { url: img },
      caption: `🖼 *${query}*\n🏷️ OMMY-MD 💥`
    }, { quoted: msg });

    await msg.react("✅"); // success

  } catch (e) {
    console.error("❌ GImage command error:", e);
    await msg.send("❌ Error fetching image!");
  }
});
