const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/antilink.json");
if (!fs.existsSync(dbPath))
  fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warns: {} }, null, 2));

const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

const linkRegex = /(https?:\/\/)?(www\.)?(chat\.whatsapp\.com|t\.me|discord\.gg|instagram\.com|youtu\.be|youtube\.com|tiktok\.com|bit\.ly)/gi;

async function handleLink(sock, m) {
  const from = m.key.remoteJid;
  const sender = m.key.participant || m.key.remoteJid;
  if (!from.endsWith("@g.us")) return;

  const db = loadDB();
  if (!db.groups[from]) return;

  const text =
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    "";
  if (!text || !linkRegex.test(text)) return;

  const metadata = await sock.groupMetadata(from).catch(() => null);
  const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
  const isBotAdmin = metadata?.participants?.some((p) => p.id === botNumber && p.admin);

  db.warns[sender] = (db.warns[sender] || 0) + 1;
  saveDB(db);

  const remaining = 3 - db.warns[sender];

  const alertMsg = `
╭─❌ *ANTI-LINK ALERT* ❌─╮
│ User: @${sender.split("@")[0]}
│ Warnings: ${db.warns[sender]}/3
╰─────────────────────╯`;

  if (isBotAdmin) await sock.sendMessage(from, { delete: m.key });
  await sock.sendMessage(from, { text: alertMsg, mentions: [sender] });
  await sock.sendMessage(from, { react: { text: "🚫", key: m.key } });

  if (db.warns[sender] >= 3 && isBotAdmin) {
    await sock.groupParticipantsUpdate(from, [sender], "remove");
    db.warns[sender] = 0;
    saveDB(db);
  }
}

smd({ pattern: "antilink", fromMe: true, desc: "Toggle Anti-Link" }, async (msg, args) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Only groups!");

  const db = loadDB();
  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Link ON");
  } else if (cmd === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Link OFF");
  } else {
    await msg.send("💡 Usage: antilink on/off");
  }
});

smd({ pattern: "message", fromMe: false, desc: "Internal hook for Anti-Link" }, async (msg, _, sock) => {
  await handleLink(sock, msg);
});
