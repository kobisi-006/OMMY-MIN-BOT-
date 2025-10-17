const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antilink.json");
if (!fs.existsSync(dbPath))
  fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warns: {} }, null, 2));

const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

const linkRegex = /(https?:\/\/)?(www\.)?(chat\.whatsapp\.com|t\.me|discord\.gg|instagram\.com|youtu\.be|youtube\.com|tiktok\.com|bit\.ly)/gi;

// Core Anti-Link handler
async function handleLink(sock, m) {
  try {
    const from = m.key.remoteJid;
    if (!from.endsWith("@g.us")) return;

    const sender = m.key.participant || m.key.remoteJid;
    const db = loadDB();
    if (!db.groups[from]) return;

    // Check message text, image caption, video caption
    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      "";

    if (!text || !linkRegex.test(text)) return;

    // Group metadata
    const metadata = await sock.groupMetadata(from).catch(() => null);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const isBotAdmin = metadata?.participants?.some(p => p.id === botNumber && p.admin);

    // Warn
    db.warns[sender] = (db.warns[sender] || 0) + 1;
    saveDB(db);
    const remaining = 3 - db.warns[sender];

    const alertMsg = `
╭─❌ *ANTI-LINK ALERT* ❌─╮
│ User: @${sender.split("@")[0]}
│ Warnings: ${db.warns[sender]}/3
╰─────────────────────╯`;

    // Delete + React if bot is admin
    if (isBotAdmin) await sock.sendMessage(from, { delete: m.key });
    await sock.sendMessage(from, { text: alertMsg, mentions: [sender] });
    await sock.sendMessage(from, { react: { text: "🚫", key: m.key } });

    // Kick if 3 warnings and bot is admin
    if (db.warns[sender] >= 3 && isBotAdmin) {
      await sock.groupParticipantsUpdate(from, [sender], "remove");
      db.warns[sender] = 0;
      saveDB(db);
      await sock.sendMessage(from, { text: `🚷 @${sender.split("@")[0]} removed after 3 warnings!`, mentions: [sender] });
    }

    // DM owner (replace with your number)
    const OWNER = "255624236654@s.whatsapp.net";
    await sock.sendMessage(OWNER, {
      text: `🚨 Anti-Link Alert in ${from}\n👤 @${sender.split("@")[0]}\n🖇️ ${text}`,
      mentions: [sender]
    });

  } catch (e) {
    console.error("❌ Anti-Link Error:", e.message);
  }
}

// Command toggle
smd({
  pattern: "antilink",
  fromMe: true,
  desc: "Toggle Anti-Link ON/OFF"
}, async (msg, args) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Only groups!");

  const db = loadDB();
  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Link activated!");
  } else if (cmd === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Link deactivated!");
  } else {
    await msg.send("💡 Usage: *antilink on/off*");
  }
});

// Hook into messages
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-Link"
}, async (msg, _, sock) => {
  await handleLink(sock, msg);
});
