const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antimentionstatus.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, logs: {} }, null, 2));

const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

async function handleMentionStatus(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return;

  const db = loadDB();
  if (!db.groups[from]) return;

  const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (!mentions.length) return;

  const sender = m.key.participant || m.key.remoteJid;
  db.logs[sender] = (db.logs[sender] || 0) + 1;
  saveDB(db);

  const alertMsg = `
╭─❌ *ANTI-MENTION* ❌─╮
│ User: @${sender.split("@")[0]}
│ Warnings: ${db.logs[sender]}/3
╰───────────────────╯`;

  await sock.sendMessage(from, { delete: m.key });
  await sock.sendMessage(from, { text: alertMsg, mentions });
  await sock.sendMessage(from, { react: { text: "❌", key: m.key } });

  const metadata = await sock.groupMetadata(from).catch(() => null);
  const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  const isBotAdmin = metadata?.participants?.some(p => p.id === botNumber && p.admin);

  if (db.logs[sender] >= 3 && isBotAdmin) {
    await sock.groupParticipantsUpdate(from, [sender], "remove");
    db.logs[sender] = 0;
    saveDB(db);
  }
}

smd({ pattern: "antimentionstatus", fromMe: true, desc: "Toggle Anti-MentionStatus" }, async (msg, args) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Only groups!");

  const db = loadDB();
  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Mention ON");
  } else if (cmd === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Mention OFF");
  } else {
    await msg.send("💡 Usage: antimentionstatus on/off");
  }
});

smd({ pattern: "message", fromMe: false, desc: "Internal hook for Anti-MentionStatus" }, async (msg, _, sock) => {
  await handleMentionStatus(sock, msg);
});
