require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const express = require("express");
const qrcode = require("qrcode-terminal");
const path = require("path");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

//==============================//
// EXPRESS SERVER (Keep Alive)
//==============================//
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("✅ OMMY-MIN-BOT is alive!"));
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));

//==============================//
// GLOBAL CONFIG
//==============================//
global.Config = {
  owner: "255624236654",
  caption: "🤖 OMMY-MIN-BOT",
  prefix: "*",
};

//==============================//
// COMMAND HANDLER
//==============================//
global.commands = global.commands || [];
function smd({ pattern, fromMe = false, desc = "" }, callback) {
  global.commands.push({ pattern, fromMe, desc, callback });
}
module.exports = { smd, Config: global.Config, commands: global.commands };

//==============================//
// AUTO LOAD PLUGINS
//==============================//
const pluginsPath = "./plugins";
if (!fs.existsSync(pluginsPath)) fs.mkdirSync(pluginsPath);

fs.readdirSync(pluginsPath)
  .filter((file) => file.endsWith(".js"))
  .forEach((file) => {
    try {
      require(path.join(pluginsPath, file));
      console.log("✅ Plugin loaded:", file);
    } catch (err) {
      console.error("❌ Failed to load plugin:", file, err);
    }
  });

//==============================//
// START BOT
//==============================//
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session/");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed! Reconnecting...");
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("✅ OMMY-MIN-BOT connected!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  //==============================//
  // WRAPPERS
  //==============================//
  function wrapMessage(msg) {
    msg.send = async (text) => {
      await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });
    };
    msg.reply = msg.send;
    msg.react = async (emoji) => {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: emoji, key: msg.key } });
    };
    return msg;
  }

  //==============================//
  // HANDLE MESSAGES
  //==============================//
  sock.ev.on("messages.upsert", async (m) => {
    try {
      const msgRaw = m.messages[0];
      if (!msgRaw.message) return;
      const msg = wrapMessage(msgRaw);

      const from = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text.startsWith(global.Config.prefix)) return;

      const body = text.slice(global.Config.prefix.length).trim();
      const [cmdName, ...args] = body.split(" ");
      const command = global.commands.find((c) => c.pattern === cmdName);
      if (!command) return;

      console.log(`📩 Command received: ${cmdName}`);
      await command.callback(msg, args, sock);
    } catch (err) {
      console.error("❌ Error handling message:", err);
    }
  });
}

//==============================//
// RUN BOT
//==============================//
startBot();
