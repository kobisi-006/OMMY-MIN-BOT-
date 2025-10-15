const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

smd({
    pattern: "ping",
    fromMe: false,
    desc: "🏓 Check bot speed and play random ping sound"
}, async (message, args, client) => {
    try {
        const chatId = message.key.remoteJid;
        const latency = Date.now() - (message.messageTimestamp * 1000);
        const now = new Date();
        const time = now.toLocaleTimeString();
        const date = now.toLocaleDateString();

        const pingText = `
╭───❮ *🏓 PING STATUS* ❯───☆
│ ⚡ Speed: ${latency}ms
│ ⏰ Time: ${time}
│ 📅 Date: ${date}
│ 🤖 Status: ✅ Active
╰─────────────────────☆`;

        // Send temporary message
        await client.sendMessage(chatId, { text: "🏓 Checking ping..." }, { quoted: message });

        // === Play random audio from /audios ===
        const audioFolder = path.join(__dirname, '../audios');
        if (fs.existsSync(audioFolder)) {
            const files = fs.readdirSync(audioFolder).filter(f => f.endsWith('.mp3'));
            if (files.length > 0) {
                const randomFile = path.join(audioFolder, files[Math.floor(Math.random() * files.length)]);
                await client.sendMessage(chatId, {
                    audio: { url: randomFile },
                    mimetype: 'audio/mp4',
                    ptt: true
                }, { quoted: message });
            }
        }

        // Send final ping text
        await client.sendMessage(chatId, { text: pingText }, { quoted: message });

    } catch (err) {
        console.error("❌ Ping command error:", err);
        await client.sendMessage(message.key.remoteJid, { text: "❌ Something went wrong while pinging." });
    }
});
