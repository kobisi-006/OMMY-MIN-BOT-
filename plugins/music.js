const { smd } = require('../lib/smd');
const axios = require('axios');

smd({
  pattern: "music",
  fromMe: false,
  desc: "🎵 Download music with thumbnail + send as voice note"
}, async (message, match, client) => {
  try {
    const query = match || message.reply_message?.text;
    if (!query)
      return await message.reply("🎶 *Usage:* !music song name or YouTube link");

    await message.react("🎧");

    // === Get audio info from API ===
    const api = `https://api.akuari.my.id/downloader/youtube2?link=${encodeURIComponent(query)}`;
    const res = await axios.get(api);
    const data = res.data?.result;

    if (!data || !data.audio)
      return await message.reply("⚠️ Could not fetch the audio. Try another query.");

    const caption = `
🎵 *${data.title || "Unknown Title"}*
📀 Channel: ${data.channel || "N/A"}
⏱️ Duration: ${data.duration || "N/A"}
👁️ Views: ${data.views || "N/A"}
🔗 ${query}
`;

    // === Send thumbnail + song details ===
    await client.sendMessage(message.jid, {
      image: { url: data.thumbnail || data.thumb || "https://telegra.ph/file/2b9e3078b8df4b8b2e35e.jpg" },
      caption: caption
    }, { quoted: message });

    // === Send audio as file ===
    await client.sendMessage(message.jid, {
      audio: { url: data.audio },
      mimetype: "audio/mp4",
      ptt: false // standard audio
    }, { quoted: message });

    // === Send audio as voice note ===
    await client.sendMessage(message.jid, {
      audio: { url: data.audio },
      mimetype: "audio/mp4",
      ptt: true // voice note
    }, { quoted: message });

    await message.react("✅");

  } catch (err) {
    console.error("🎵 Music Error:", err);
    await message.reply("❌ Failed to download music.");
  }
});
