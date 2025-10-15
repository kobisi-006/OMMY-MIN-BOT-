const { smd } = require('../lib/smd');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

smd({
  pattern: "yt",
  fromMe: false,
  desc: "🎵 Download YouTube video + audio as voice note"
}, async (message, args, client) => {
  try {
    const url = args[0];
    if (!url) return await client.sendMessage(message.key.remoteJid, { text: "❌ Usage: *!yt <youtube_link>*" });

    await client.sendMessage(message.key.remoteJid, { text: "⏳ Downloading video..." }, { quoted: message });

    const videoInfo = await ytdl.getInfo(url);
    const title = videoInfo.videoDetails.title;
    const thumb = videoInfo.videoDetails.thumbnails.pop().url;

    const audioPath = path.join(__dirname, "../temp/audio.mp3");
    const videoPath = path.join(__dirname, "../temp/video.mp4");
    if (!fs.existsSync(path.join(__dirname, "../temp"))) fs.mkdirSync(path.join(__dirname, "../temp"));

    const audioStream = ytdl(url, { filter: 'audioonly' });
    const videoStream = ytdl(url, { filter: 'videoandaudio' });

    const audioWrite = fs.createWriteStream(audioPath);
    const videoWrite = fs.createWriteStream(videoPath);

    audioStream.pipe(audioWrite);
    videoStream.pipe(videoWrite);

    await new Promise(resolve => audioWrite.on('finish', resolve));
    await new Promise(resolve => videoWrite.on('finish', resolve));

    // send thumbnail + caption
    await client.sendMessage(message.key.remoteJid, {
      image: { url: thumb },
      caption: `🎬 ${title}`
    }, { quoted: message });

    // send audio as voice note
    await client.sendMessage(message.key.remoteJid, {
      audio: { url: audioPath },
      mimetype: "audio/mp4",
      ptt: true
    }, { quoted: message });

    // clean temp files
    fs.unlinkSync(audioPath);
    fs.unlinkSync(videoPath);

  } catch (err) {
    console.error("❌ Video/Music error:", err);
    await client.sendMessage(message.key.remoteJid, { text: "❌ Failed to download video/audio." });
  }
});
