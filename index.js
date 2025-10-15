//==============================//
//  OMMY-MIN-BOT MAIN FILE
//==============================//

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const express = require("express");
const qrcode = require("qrcode-terminal");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

//==============================//
//  EXPRESS SERVER (Keep Alive)
//==============================//
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("✅ OMMY-MIN-BOT is alive and running!"));
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));

//==============================//
//  GLOBAL CONFIG
//==============================//
global.Config = {
  owner: "255624236654", // 👈 weka namba yako hapa
  caption: "🤖 OMMY-MIN-BOT",
  prefix: "*", // Prefix ya commands
};

//==============================//
//  COMMAND HANDLER SYSTEM
//==============================//
global.commands = global.commands || [];

function smd({ pattern, fromMe = false, desc = "" }, callback) {
  global.commands.push({ pattern, fromMe, desc, callback });
}

// 🔄 Export ili plugins zote ziitumie
module.exports = { smd, Config: global.Config, commands: global.commands };

//==============================//
//  AUTO LOAD PLUGINS
//==============================//
const pluginsPath = path.join(__dirname, "plugins");
if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath);

fs.readdirSync(pluginsPath)
  .filter(file => file.endsWith(".js"))
  .forEach(file => {
    try {
      require(path.join(pluginsPath, file)); // plugin lazima itumie smd(...)
      console.log("✅ Loaded plugin:", file);
    } catch (err) {
      console.error("❌ Failed to load plugin:", file, err);
    }
  });

//==============================//
//  START WHATSAPP BOT
//==============================//
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session/");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  // === QR Code Event ===
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("📱 Scan this QR code on WhatsApp to log in:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed! Reconnecting...");
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ OMMY-MIN-BOT connected successfully!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  //==============================//
  //  HANDLE INCOMING MESSAGES
  //==============================//
  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msg = m.messages[0];
      if (!msg.message) return;

      const from = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text.startsWith(global.Config.prefix)) return;

      const body = text.slice(global.Config.prefix.length).trim();
      const [cmdName, ...args] = body.split(" ");
      const command = global.commands.find((c) => c.pattern === cmdName);

      if (command) {
        console.log(`📩 Command received: ${cmdName}`);

        await command.callback(
          {
            reply: async (text) =>
              await sock.sendMessage(from, { text }, { quoted: msg }),
            send: async (text) =>
              await sock.sendMessage(from, { text }, { quoted: msg }),
            sendFile: async (file, caption = "") =>
              await sock.sendMessage(
                from,
                { image: { url: file }, caption },
                { quoted: msg }
              ),
            sendAudio: async (filePath) =>
              await sock.sendMessage(
                from,
                { audio: { url: filePath }, mimetype: "audio/mp4", ptt: true },
                { quoted: msg }
              ),
            react: async (emoji) => {
              try { await sock.sendMessage(from, { react: { text: emoji, key: msg.key } }); } catch {}
            }
          },
          { args, msg, sock }
        );
      }
    } catch (err) {
      console.error("❌ Error handling message:", err);
    }
  });
}

//==============================//
//  RUN BOT
//==============================//
startBot();
