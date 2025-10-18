const fs = require("fs");
const path = require("path");
const { smd } = require("../index");
const axios = require("axios");

// Database ya logs
const dbPath = path.join(__dirname, "../db/antiban.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ blacklist: [], banned: [] }, null, 2));

const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

// 🔒 Orodha ya maneno hatari au viungo vya hack
const maliciousPatterns = [
  /(https?:\/\/)?(api|bot|crash|ddos|exploit|session)\.(net|org|xyz|io)/gi,
  /(eval|process\.env|child_process|fs\.unlink|os\.userInfo)/gi,
  /(whatsapp\.com\/(hacker|stealer|exploit))/gi,
  /(t\.me\/joinchat|discord\.gg|darkweb)/gi,
  /(bot\s+session|export\s+SESSION|saveauth)/gi,
];

// 🧰 Function ya kuzuia mashambulio
async function protectAccount(sock, msg) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const body =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    "";

  if (!body) return;

  const db = loadDB();

  // Cheki kama sender yuko kwenye blacklist
  if (db.blacklist.includes(sender)) {
    await sock.sendMessage(from, {
      text: `🚫 *Blocked user detected!* @${sender.split("@")[0]} ni hatari. Message deleted.`,
      mentions: [sender],
    });
    await sock.sendMessage(from, { delete: msg.key });
    return;
  }

  // 🔍 Angalia kama kuna mashambulio
  if (maliciousPatterns.some((regex) => regex.test(body))) {
    db.blacklist.push(sender);
    saveDB(db);

    await sock.sendMessage(from, {
      text: `⚠️ *SECURITY ALERT!*\n@${sender.split("@")[0]} ametuma ujumbe hatari 🧨\n\n⛔ Amewekwa kwenye orodha ya BLACKLIST.`,
      mentions: [sender],
    });

    // Kama ni group na bot ni admin → remove
    if (from.endsWith("@g.us")) {
      const meta = await sock.groupMetadata(from).catch(() => null);
      const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const isBotAdmin = meta?.participants?.some(
        (p) => p.id === botNumber && p.admin
      );

      if (isBotAdmin) {
        await sock.groupParticipantsUpdate(from, [sender], "remove");
        db.banned.push(sender);
        saveDB(db);
      }
    }
  }

  // Flood detection
  const words = body.split(/\s+/).length;
  if (words > 100) {
    await sock.sendMessage(from, {
      text: `🚨 *Flood Detected!* @${sender.split("@")[0]} ametuma spam messages nyingi.`,
      mentions: [sender],
    });
    db.blacklist.push(sender);
    saveDB(db);
    await sock.sendMessage(from, { delete: msg.key });
  }
}

// Command kuu
smd({
  pattern: "antiban",
  fromMe: true,
  desc: "⚔️ Turn ON/OFF AntiBan protection system",
}, async (msg, args) => {
  const db = loadDB();
  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    db.active = true;
    saveDB(db);
    await msg.send("🛡️ *AntiBan System Enabled!* Your account is now under protection.");
  } else if (cmd === "off") {
    db.active = false;
    saveDB(db);
    await msg.send("⚠️ *AntiBan System Disabled!* You are now unprotected.");
  } else {
    await msg.send("💡 Usage: antiban on/off");
  }
});

// Hook kwa kila message
smd({
  pattern: "msg",
  fromMe: false,
  desc: "Internal hook for AntiBan protection",
}, async (msg, _, sock) => {
  const db = loadDB();
  if (db.active) await protectAccount(sock, msg);
});
