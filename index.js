require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Prefix ya bot
const PREFIX = '*';

// Command handler
global.commands = global.commands || [];
function smd({ pattern, fromMe = false, desc = '' }, callback) {
    global.commands.push({ pattern, fromMe, desc, callback });
}
module.exports = { smd };

// Express server (keep-alive)
app.get('/', (req, res) => res.send('OMMY-MIN-BOT is alive ✅'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Config ya bot
global.Config = {
    caption: "OMMY-MIN-BOT 🤖",
    owner: "255624236654" // badilisha na number yako
};


// Load plugins automatically
const pluginsPath = './plugins';
if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath);
fs.readdirSync(pluginsPath).forEach(file => {
    require(`${pluginsPath}/${file}`);
});

// ------------------------
// WhatsApp Connection - Baileys
// ------------------------
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session/');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state // printQRInTerminal imeondolewa
    });

    // 🔹 QR code listener
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if(qr) {
            console.log('Scan this QR code on WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if(connection === 'close') {
            if(lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                console.log('Reconnecting...');
                startBot();
            }
        } else if(connection === 'open') {
            console.log('OMMY-MIN-BOT connected ✅');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages
    sock.ev.on('messages.upsert', async m => {
        const messages = m.messages;
        for(const msg of messages) {
            if(!msg.message) continue;
            let text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if(!text) continue;

            if(text.startsWith(PREFIX)) {
                const commandText = text.slice(PREFIX.length);
                for(const cmd of global.commands) {
                    if(cmd.pattern === commandText) {
                        await cmd.callback({
                            send: async reply => {
                                await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
                            },
                            sendFile: async (file, txt) => {
                                await sock.sendMessage(msg.key.remoteJid, { image: { url: file }, caption: txt }, { quoted: msg });
                            }
                        }, commandText);
                    }
                }
            }
        }
    });
}

startBot();
