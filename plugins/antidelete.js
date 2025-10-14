const { smd } = require('../lib/smd');

// Global store for anti-delete per chat
global.antidelete = global.antidelete || {};
global.deletedMessages = global.deletedMessages || {};

smd({
    pattern: 'antidelete',
    fromMe: true,
    desc: 'Toggle Anti-Delete on/off per chat',
}, async (message, text) => {
    const chatId = message.key.remoteJid;
    global.antidelete[chatId] = global.antidelete[chatId] || false;

    if (text.toLowerCase() === 'on') {
        global.antidelete[chatId] = true;
        await message.send(`✅ Anti-Delete is now *ENABLED* for this chat.`);
    } else if (text.toLowerCase() === 'off') {
        global.antidelete[chatId] = false;
        await message.send(`❌ Anti-Delete is now *DISABLED* for this chat.`);
    } else {
        await message.send(`⚡ Status: *${global.antidelete[chatId] ? 'ENABLED' : 'DISABLED'}*\nUse *antidelete on/off* to toggle.`);
    }
});

// Listener for deleted messages
smd({
    pattern: 'msg.delete',
    fromMe: false,
    desc: 'Restore deleted messages automatically',
}, async (message, text) => {
    const chatId = message.key.remoteJid;
    if (!global.antidelete[chatId]) return;

    try {
        const deleted = message.message?.protocolMessage;
        if (!deleted) return;

        const sender = message.key.participant || message.key.remoteJid;
        const deletedType = Object.keys(deleted)[0];
        const content = deleted[deletedType];

        // Save deleted message to history
        global.deletedMessages[sender] = global.deletedMessages[sender] || [];
        global.deletedMessages[sender].push({ type: deletedType, content, time: new Date().toLocaleString() });

        // Restore message
        let restoredText = `⚠️ *Message deleted by ${sender.split('@')[0]}*\nType: ${deletedType}\nTime: ${new Date().toLocaleTimeString()}\n\n`;

        if (content?.text || content?.caption) {
            restoredText += content.text || content.caption;
        }

        // Send text
        await message.send(restoredText);

        // Send media if exists
        if (content?.image || content?.video || content?.audio || content?.document || content?.sticker) {
            await message.sendFile(content.url, `📎 Restored ${deletedType}`, { quoted: message });
        }

    } catch (err) {
        console.log('Anti-Delete Error:', err);
        try {
            await message.send(`❌ Error restoring deleted message: ${err.message}`);
        } catch(e) { console.log(e); }
    }
});
