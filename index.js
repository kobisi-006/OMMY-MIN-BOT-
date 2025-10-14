//==============================//
//  OMMY-MIN-BOT MAIN FILE
//==============================//

require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const qrcode = require("qrcode-terminal");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
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
  owner: "255624236654", // 👈 badilisha namba yako
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
module.exports = { smd };

//==============================//
//  AUTO LOAD PLUGINS
//==============================//
const pluginsPath = "./plugins";
if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath);
fs.readdirSync(pluginsPath)
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => {
    require(`${pluginsPath}/${file}`);
    console.log("✅ Plugin loaded:", file);
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
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
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
            send: async (reply) =>
              await sock.sendMessage(from, { text: reply }, { quoted: msg }),
            sendFile: async (file, caption = "") =>
              await sock.sendMessage(
                from,
                { image: { url: file }, caption },
                { quoted: msg }
              ),
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
