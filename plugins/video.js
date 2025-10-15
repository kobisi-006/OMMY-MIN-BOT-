const { smd } = require('../lib/smd');
const axios = require('axios');

smd({
  pattern: "video",
  fromMe: false,
  desc: "🎬 Download YouTube video with thumbnail"
}, async (message, match, client) => {
  try {
    const query = match || message.reply_message?.text;
    if (!query)
      return await message.reply("❌ *Please provide a YouTube link!*\nExample: !video https://youtu.be/example");

    await message.react("📥");

    const api = `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(query)}`;
    const res = await axios.get(api);
    const data = res.data?.result;

    if (!data || !data.title || !data.url)
      return await message.reply("⚠️ Could not fetch the video. Try another link.");

    const caption = `
🎬 *${data.title}*
📺 Channel: ${data.channel || "Unknown"}
👁️ Views: ${data.views || "N/A"}
🕒 Duration: ${data.duration || "N/A"}
🔗 ${query}
`;

    await client.sendMessage(message.jid, {
      image: { url: data.thumbnail || data.thumb || "https://telegra.ph/file/ee2a3e93a5be3bda08c67.jpg" },
      caption: caption
    }, { quoted: message });

    await client.sendMessage(message.jid, {
      video: { url: data.url },
      caption: "✅ *Here’s your video!*"
    }, { quoted: message });

    await message.react("✅");
  } catch (err) {
    console.error("🎬 Video Error:", err);
    await message.reply("❌ Failed to download video.");
  }
});
