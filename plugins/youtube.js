// plugins/youtube.js
const axios = require("axios");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");
const { smd } = require("../index"); // au ../lib/smd kulingana na structure yako
const randomEmojis = ["🔥","😂","😎","🤩","❤️","👌","🎯","💀","🥵","👀"];

const SERPAPI_KEY = "6084018373e1103ad98c592849e59eb1f0abf4a5996841a2ba78a6c9c70c9058";

smd({
  pattern: "youtube",
  fromMe: false,
  desc: "🎬 Search YouTube, return top video and send audio as voice note",
}, async (msg, args, client) => {
  if (!args.length) return msg.send("⚠️ Andika video title!");

  await msg.react(randomEmojis[Math.floor(Math.random()*randomEmojis.length)]);

  const query = args.join(" ");
  try {
    // Search video
    const res = await axios.get("https://serpapi.com/search.json", {
      params: { q: query, tbm: "vid", api_key: SERPAPI_KEY }
    });
    const first = res.data.video_results?.[0];
    if (!first) return msg.send("❌ Hakuna video!");

    const videoUrl = first.link;
    const title = first.title;
    const channel = first.channel;

    // Send video info
    await msg.send(`🎬 *${title}*\n📀 Channel: ${channel}\n🌐 ${videoUrl}\n🏷️ OMMY-MD 💥`);

    // Download audio
    const tempPath = path.join(__dirname, "temp_audio.mp3");
    const stream = ytdl(videoUrl, { filter: "audioonly", quality: "highestaudio" });
    const writeStream = fs.createWriteStream(tempPath);
    stream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Send audio as voice note
    await client.sendMessage(msg.key.remoteJid, {
      audio: { url: tempPath },
      mimetype: "audio/mp4",
      ptt: true
    }, { quoted: msg });

    fs.unlinkSync(tempPath); // delete temp file
    await msg.react("✅"); // success

  } catch (err) {
    console.error("❌ YouTube command error:", err);
    await msg.send("❌ Tatizo ku-fetch video/audio!");
  }
});
