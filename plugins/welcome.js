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

// Core: handle member join
async function handleWelcome(sock, m) {
  const from = m.key.remoteJid;
  if (!from.endsWith("@g.us")) return;

  const db = loadDB();
  if (!db.groups[from]) return; // Welcome OFF

  const participants = m.message?.groupUpdate?.participants || [];
  for (let user of participants) {
    await sock.sendMessage(from, {
      text: `
╭─❮ 🎉 WELCOME ❯─☆
│ 👋 Hello @${user.split("@")[0]}!
│ 🎊 Welcome to the group!
│ 🏷️ OMMY-MD 💥
╰───────────────☆
      `,
      mentions: [user]
    });
  }
}

// Toggle command
smd({
  pattern: "welcome",
  fromMe: true,
  desc: "⚙️ Toggle Welcome On/Off",
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const db = loadDB();
  const arg = (args[0] || "").toLowerCase();

  if (arg === "on") {
    db.groups[from] = true;
    saveDB(db);
    await msg.send("✅ Welcome activated ✅\n🏷️ OMMY-MD 💥");
  } else if (arg === "off") {
    db.groups[from] = false;
    saveDB(db);
    await msg.send("⚠️ Welcome deactivated ⚠️\n🏷️ OMMY-MD 💥");
  } else {
    await msg.send("⚠️ Usage: *welcome on/off*");
  }
});

// Hook into messages.upsert
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Welcome",
}, async (msg, args, client) => {
  await handleWelcome(client, msg);
});
