const fs = require("fs");
const path = require("path");
const { smd } = require("../index");

const dbPath = path.join(__dirname, "../db/welcome.json");
if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({ groups: {} }, null, 2));

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Core: handle member leave
async function handleGoodbye(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return;

  const db = loadDB();
  if (!db.groups[from]) return; // Goodbye OFF (same as welcome setting)

  const participants = m.message?.groupUpdate?.participants || [];
  for (let user of participants) {
    await sock.sendMessage(from, {
      text: `
╭─❮ 👋 GOODBYE ❯─☆
│ 😔 Bye @${user.split("@")[0]}!
│ 👋 We will miss you!
│ 🏷️ OMMY-MD 💥
╰───────────────☆
      `,
      mentions: [user]
    });
  }
}

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Goodbye",
}, async (msg, args, client) => {
  await handleGoodbye(client, msg);
});
