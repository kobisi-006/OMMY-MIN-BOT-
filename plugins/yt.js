// plugins/yt.js
const { smd } = require('../lib/smd');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs');
const path = require('path');

smd({
    pattern: "yt",
    fromMe: false,
    desc: "🎵 Download YouTube video/audio with thumbnail as voice note"
}, async (message, match, client) => {
    try {
        const chatId = message.jid;
        const query = match || message.reply_message?.text;
        if (!query) return await message.send("❌ Please provide a search term or URL.\nExample: *!yt diamond wewe song*");

        await message.react("⏳"); // processing

        let videoUrl = query;
        // Check if not a URL, search on YouTube
        if (!videoUrl.startsWith('http')) {
            const result = await ytSearch(query);
            if (!result || !result.videos || result.videos.length === 0) {
                return await message.send("❌ No results found on YouTube.");
            }
            videoUrl = result.videos[0].url;
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title;
        const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url;

        // Paths
        const tempVideoPath = path.join(__dirname, 'temp_audio.mp3');

        // Download audio as mp3
        const stream = ytdl(videoUrl, { filter: 'audioonly', quality: 'highestaudio' });
        const writeStream = fs.createWriteStream(tempVideoPath);
        stream.pipe(writeStream);

        // Wait until download finishes
        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        // Send thumbnail + title
        await client.sendMessage(chatId, {
            image: { url: thumbnail },
            caption: `🎵 *${title}*\n\n✅ Downloaded successfully!`
        }, { quoted: message });

        // Send audio as voice note
        await client.sendMessage(chatId, {
            audio: { url: tempVideoPath },
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: message });

        // Delete temp file
        fs.unlinkSync(tempVideoPath);

        await message.react("✅"); // success

    } catch (err) {
        console.error("❌ YouTube Download Error:", err);
        await message.send("❌ Failed to download video/audio. Try again later.");
    }
});
