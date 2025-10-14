const { smd } = require('../lib/smd');

// Global store for toggling per chat
global.antivv = global.antivv || {};

// Command to toggle Anti-VV
smd({
    pattern: 'antivv',
    fromMe: true,
    desc: 'Toggle Anti-View-Once (on/off) per chat',
}, async (message, text) => {
    const chatId = message.key.remoteJid;
    global.antivv[chatId] = global.antivv[chatId] || false;

    if (text?.toLowerCase() === 'on') {
        global.antivv[chatId] = true;
        await message.send(`✅ Anti-VV is now *ENABLED* for this chat.`);
    } else if (text?.toLowerCase() === 'off') {
        global.antivv[chatId] = false;
        await message.send(`❌ Anti-VV is now *DISABLED* for this chat.`);
    } else {
        await message.send(`⚡ Current status: *${global.antivv[chatId] ? 'ENABLED' : 'DISABLED'}*\nUse *antivv on/off* to toggle.`);
    }
});

// Listener for intercepting View-Once messages
smd({
    pattern: 'msg.upsert',
    fromMe: false,
    desc: 'Catch View-Once media and resend',
}, async (message) => {
    const chatId = message.key.remoteJid;
    if (!global.antivv[chatId]) return;

    try {
        const msg = message.message;
        if (!msg) return;

        // Detect if message is view-once
        const isViewOnce = msg?.imageMessage?.viewOnce || msg?.videoMessage?.viewOnce || msg?.documentMessage?.viewOnce;
        if (!isViewOnce) return;

        // Fetch sender profile picture
        let senderProfilePic = "https://telegra.ph/file/1e60489705c851f74b55e.jpg"; // fallback
        try {
            if(message.bot.user) senderProfilePic = await message.bot.profilePictureUrl(message.key.participant || chatId);
        } catch(e){ console.log("Using fallback profile pic:", e.message); }

        const sender = message.key.participant || chatId;
        const timestamp = new Date(parseInt(message.messageTimestamp)*1000).toLocaleString();

        const alertText = `⚠️ *View-Once media intercepted*
From: @${sender.split('@')[0]}
Time: ${timestamp}`;

        if (msg.imageMessage) {
            await message.sendFile(msg.imageMessage.url, `${alertText}`, { quoted: message, mentions: [sender] });
        } else if (msg.videoMessage) {
            await message.sendFile(msg.videoMessage.url, `${alertText}`, { quoted: message, mentions: [sender] });
        } else if (msg.documentMessage) {
            await message.sendFile(msg.documentMessage.url, `${alertText}`, { quoted: message, mentions: [sender] });
        }

    } catch (err) {
        console.log('Anti-VV Error:', err);
        try {
            await message.send(`❌ Error restoring View-Once media: ${err.message}`, { quoted: message });
        } catch(e){ console.log(e); }
    }
});
