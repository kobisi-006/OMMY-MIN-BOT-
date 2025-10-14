const { smd } = require('../lib/smd');
const fs = require('fs');
const path = require('path');

// Helper: pick random file from folder
function getRandomFile(folder) {
    const files = fs.readdirSync(folder).filter(f => f.endsWith('.mp3'));
    if (files.length === 0) return null;
    return path.join(folder, files[Math.floor(Math.random() * files.length)]);
}

// Advanced Ping Command
smd({
    pattern: 'ping',
    fromMe: false,
    desc: '🏓 Advanced Ping with auto-random voice note (music)'
}, async (message) => {
    try {
        const audioFolder = path.join(__dirname, '../audios');
        if (!fs.existsSync(audioFolder)) return await message.send('❌ Audio folder not found!');

        // Pick random beep and main audio
        const beepAudio = getRandomFile(audioFolder); // random beep
        const mainAudio = getRandomFile(audioFolder); // random ping/music

        // Optional delay for realism
        const delay = Math.floor(Math.random() * 1000) + 500;
        await new Promise(res => setTimeout(res, delay));

        // Send beep first if exists
        if (beepAudio) await message.sendFile(beepAudio, '🔊 Beep!', 'audio/mp3', true);

        // Send main random music ping as voice note
        if (mainAudio) await message.sendFile(mainAudio, '🏓 Pong!', 'audio/mp3', true);

        // Send text feedback
        await message.send(`🏓 Pong! Response delay: ${delay}ms`);

    } catch (err) {
        console.log('Error in advanced ping:', err);
        await message.send('❌ Something went wrong while sending ping.');
    }
});
