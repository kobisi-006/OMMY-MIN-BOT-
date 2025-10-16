
// plugins/antibad.js
const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

// DB folder na file
const dbFolder = path.join(__dirname, "../db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const dbPath = path.join(dbFolder, "antibad.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {} }, null, 2));

// Load/Save DB
function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Bad words list (example)
const badWords = [
  "badword1", "badword2", "badword3", // ongeza maneno yote unayotaka kufuatilia
  "mfukoo", "mpumbavu", "kikomo" ,"msenge" ,"fala " , // unaweza kuongeza zaidi
];

// Core function
async function handleAntiBad(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return; // only groups

  const db = loadDB();
  if (!db.groups[from]) return; // Anti-Bad OFF

  const text = m.message?.conversation || m.message?.extendedTextMessage?.text;
  if (!text) return;

  try {
    const found = badWords.find(word => text.toLowerCase().includes(word.toLowerCase()));
    if (found) {
      // Delete message
      await sock.sendMessage(from, { delete: m.key });
      await sock.sendMessage(from, {
        text: `
╭─❮ ⚠️ ANTI-BAD LANGUAGE ❯─☆
│ 🚫 @${m.key.participant.split("@")[0]} used a bad word!
│ ❌ Message deleted!
╰───────────────☆
🏷️ OMMY-MD 💥
        `,
        mentions: [m.key.participant]
      });
      console.log(`✅ Deleted bad word in ${from} from ${m.key.participant}`);
    }
  } catch (e) {
    console.error("AntiBad Error:", e.message);
  }
}

// Toggle command
smd({
  pattern: "antibad",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Bad Language On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();

  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Anti-Bad Language activated ✅\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Anti-Bad Language deactivated ⚠️\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *antibad on/off*");
  }
});

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-Bad Language",
}, async (msg, args, client) => {
  await handleAntiBad(client, msg);
});
