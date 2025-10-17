const fs = require("fs");
const path = require("path");
const { smd, Config } = require("../index");

const dbPath = path.join(__dirname, "../db/antidelete.json");
if (!fs.existsSync(dbPath))
  fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, deleted: {} }, null, 2));

const loadDB = () => JSON.parse(fs.readFileSync(dbPath));
const saveDB = (db) => fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

async function handleDelete(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // Only groups

  const db = loadDB();
  if (!db.groups[from]) return;

  const sender = m.key.participant || m.key.remoteJid;
  db.deleted[m.key.id] = m.message;
  saveDB(db);

  // Alert box (group)
  const groupAlert = `
╭─⚠️ *MESSAGE DELETED* ⚠️─╮
│ User: @${sender.split("@")[0]}
│ Type: ${Object.keys(m.message)[0]}
╰─────────────────────╯`;

  // Alert box (DM)
  const dmAlert = `
╭─🚨 *DELETED MESSAGE ALERT* 🚨─╮
│ Group: ${from.split("@")[0]}
│ User: @${sender.split("@")[0]}
│ Message Type: ${Object.keys(m.message)[0]}
│ Content saved in DB
╰─────────────────────────╯`;

  // React in group
  await sock.sendMessage(from, { react: { text: "⚠️", key: m.key } });

  // Send alert in group
  await sock.sendMessage(from, { text: groupAlert, mentions: [sender] });

  // Send DM to owner
  await sock.sendMessage(Config.owner + "@s.whatsapp.net", { text: dmAlert, mentions: [sender] });
}

// Toggle command
smd({ pattern: "antidelete", fromMe: true, desc: "Toggle Anti-Delete Pro (Group + DM)" }, async (msg, args) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Only groups!");

  const db = loadDB();
  const cmd = (args[0] || "").toLowerCase();

  if (cmd === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Delete Pro ON (Group + DM alert enabled)");
  } else if (cmd === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Delete Pro OFF");
  } else {
    await msg.send("💡 Usage: antidelete on/off");
  }
});

// Internal hook
smd({ pattern: "message-delete", fromMe: false, desc: "Internal hook for Anti-Delete Pro" }, async (msg, _, sock) => {
  await handleDelete(sock, msg);
});
