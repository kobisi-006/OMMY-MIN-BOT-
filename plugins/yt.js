const { smd } = require('../index');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

smd({
  pattern: "yt",
  fromMe: false,
  desc: "Download YouTube audio or video with choice",
}, async (msg, args, client) => {
  try {
    const chatId = msg.key.remoteJid;
    if (!args[0]) return msg.send("❌ Usage: *yt <audio|video> <search or URL>");

    const type = args[0].toLowerCase();
    const query = args.slice(1).join(" ");
    if (!query) return msg.send("❌ Please provide search term or URL.");

    if (!["audio", "video"].includes(type)) {
      return msg.send("❌ Type must be *audio* or *video*.\nExample: *yt audio diamond wewe*");
    }

    await msg.react("⏳"); // processing

    let videoUrl = query;
    if (!videoUrl.startsWith("http")) {
      const result = await ytSearch(query);
      if (!result || !result.videos || result.videos.length === 0) {
        return msg.send("❌ No results found on YouTube.");
      }
      videoUrl = result.videos[0].url;
    }

    const info = await ytdl.getInfo(videoUrl);
    const title = info.videoDetails.title;
    const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;
    const videoLength = parseInt(info.videoDetails.lengthSeconds);

    // --- AUDIO DOWNLOAD ---
    if (type === "audio") {
      const tempAudio = path.join(__dirname, `temp_${Date.now()}.mp3`);
      const tempTrimmed = path.join(__dirname, `trimmed_${Date.now()}.mp3`);

      const audioStream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
      const audioWrite = fs.createWriteStream(tempAudio);
      audioStream.pipe(audioWrite);

      await new Promise((resolve, reject) => {
        audioWrite.on('finish', resolve);
        audioWrite.on('error', reject);
      });

      // Trim if >5min
      if (videoLength > 300) {
        await new Promise((resolve, reject) => {
          ffmpeg(tempAudio)
            .setStartTime(0)
            .setDuration(180)
            .output(tempTrimmed)
            .on('end', resolve)
            .on('error', reject)
            .run();
        });
      }

      const finalAudio = fs.existsSync(tempTrimmed) ? tempTrimmed : tempAudio;

      // Send thumbnail + caption
      await client.sendMessage(chatId, {
        image: { url: thumbnail },
        caption: `🎵 *${title}* (Audio)\n✅ Downloaded!\n🏷️ OMMY-MD 💥`
      }, { quoted: msg });

      // Send audio
      await client.sendMessage(chatId, {
        audio: { url: finalAudio },
        mimetype: 'audio/mp4',
        ptt: true
      }, { quoted: msg });

      // Delete temp
      fs.unlinkSync(tempAudio);
      if (fs.existsSync(tempTrimmed)) fs.unlinkSync(tempTrimmed);

    } else if (type === "video") {
      // --- VIDEO DOWNLOAD ---
      const tempVideo = path.join(__dirname, `video_${Date.now()}.mp4`);
      const videoStream = ytdl(videoUrl, { quality: 'highestvideo' });
      const videoWrite = fs.createWriteStream(tempVideo);
      videoStream.pipe(videoWrite);

      await new Promise((resolve, reject) => {
        videoWrite.on('finish', resolve);
        videoWrite.on('error', reject);
      });

      // Send thumbnail + caption
      await client.sendMessage(chatId, {
        image: { url: thumbnail },
        caption: `🎬 *${title}* (Video)\n✅ Downloaded!\n🏷️ OMMY-MD 💥`
      }, { quoted: msg });

      // Send video
      await client.sendMessage(chatId, {
        video: { url: tempVideo },
        caption: `🎬 *${title}* (Video)\n🏷️ OMMY-MD 💥`
      }, { quoted: msg });

      fs.unlinkSync(tempVideo);
    }

    await msg.react("✅");

  } catch (err) {
    console.error("❌ YouTube Choice Downloader Error:", err);
    await msg.send("❌ Failed to download. Try again later.");
  }
});
