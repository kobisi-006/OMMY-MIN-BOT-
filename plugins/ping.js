// plugins/ping.js
const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

smd({
    pattern: "ping",
    fromMe: false,
    desc: "🏓 Check bot speed with styled output and random ping sound"
}, async (message, args, client) => {
    try {
        const now = new Date();
        const latency = Date.now() - (message.msg.messageTimestamp * 1000); // ms
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const date = now.toLocaleDateString();

        // Reaction emoji for fun
        await client.send("⚡ Pinging... ⏳");

        // Play random ping audio from /audios
        const audioFolder = path.join(__dirname, '../audios');
        if (fs.existsSync(audioFolder)) {
            const files = fs.readdirSync(audioFolder).filter(f => f.endsWith('.mp3'));
            if (files.length > 0) {
                const randomFile = path.join(audioFolder, files[Math.floor(Math.random() * files.length)]);
                await client.sendAudio(randomFile);
            }
        }

        // Determine greeting based on time
        let wish = '🌙 GOOD NIGHT';
        if(hours >= 5 && hours < 12) wish = '⛅ GOOD MORNING';
        else if(hours >= 12 && hours < 17) wish = '🌞 GOOD AFTERNOON';
        else if(hours >= 17 && hours < 20) wish = '🌇 GOOD EVENING';

        // Styled ping output
        const pingText = `
╭─────────────────────────╮
│       ${wish}       
│ ⚡ Bot Latency : ${latency}ms
│ ⏰ Time        : ${hours}:${minutes}:${seconds}
│ 📅 Date        : ${date}
│ 🤖 Status      : ✅ Active
╰─────────────────────────╯
`;

        await client.send(pingText);

    } catch (err) {
        console.error("❌ Ping command error:", err);
        await client.send("❌ Something went wrong while pinging.");
    }
});
