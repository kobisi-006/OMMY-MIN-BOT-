// plugins/antibad.js
const fs = require("fs");
const path = require("path");
const { smd, Config } = require("../index");

// DB path
const dbFolder = path.join(__dirname, "../db");
if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder);

const dbPath = path.join(dbFolder, "antibad.json");
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ groups: {}, warns: {} , options: { dmOwnerOnDetect: true } }, null, 2));
}

function loadDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}
function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Define bad words (add/remove as needed)
const badWords = [
  // English examples
  "idiot", "stupid", "dumb", "bastard", "asshole", "fuck", "shit", "bitch",
  // Swahili examples
  "mpumbavu", "mlevi", "mchoyo", "kibaya", "mshenzi",
  // Add more words you want to block
];

// Build a single regex for faster checks (word boundary + case insensitive)
const badRegex = new RegExp(`\\b(${badWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|")})\\b`, "i");

// Minimal alert box (short & modern)
function makeAlertBox(username, count) {
  return `
╭─❌ *ANTI-BAD* ❌─╮
│ 👤 @${username}
│ ⚠️ ${count}/3
╰──────────────╯
💎 OMMY-MD
`;
}

// Core handler
async function handleAntiBad(sock, m) {
  try {
    const from = m.key.remoteJid;
    if (!from?.endsWith?.("@g.us")) return; // only groups

    const db = loadDB();
    if (!db.groups[from]) return; // feature off

    // gather text from various message types
    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      "";

    if (!text) return;
    if (!badRegex.test(text)) return;

    const sender = m.key.participant || m.key.remoteJid;
    const username = sender.split("@")[0];

    // get group metadata and admin status
    const metadata = await sock.groupMetadata(from).catch(() => null);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const isBotAdmin = metadata?.participants?.some(p => p.id === botNumber && p.admin);

    // increment warn count
    const warns = db.warns;
    warns[sender] = (warns[sender] || 0) + 1;
    saveDB(db);

    const count = warns[sender];

    // If bot is admin -> delete message; else just notify
    if (isBotAdmin) {
      // delete offending message
      await sock.sendMessage(from, { delete: m.key }).catch(() => null);
    }

    // send alert box in group (mentions user)
    const box = makeAlertBox(username, count);
    await sock.sendMessage(from, { text: box, mentions: [sender] }).catch(() => null);

    // react to message (best-effort)
    await sock.sendMessage(from, { react: { text: "❌", key: m.key } }).catch(() => null);

    // if warnings >=3 => remove if bot is admin; otherwise inform
    if (count >= 3) {
      if (isBotAdmin) {
        await sock.groupParticipantsUpdate(from, [sender], "remove").catch(() => null);
        // notify group about removal
        await sock.sendMessage(from, {
          text: `🚷 @${username} removed after 3 warnings.`,
          mentions: [sender],
        }).catch(() => null);
        // reset count
        db.warns[sender] = 0;
        saveDB(db);
      } else {
        // bot not admin — inform owners/admins
        await sock.sendMessage(from, {
          text: `⚠️ @${username} reached 3 warnings but bot cannot remove (not admin).`,
          mentions: [sender],
        }).catch(() => null);
      }
    }

    // Optionally DM owner with detected content (if configured)
    if (db.options?.dmOwnerOnDetect && Config?.owner) {
      const ownerJid = (Config.owner || "").toString();
      if (ownerJid) {
        const ownerFull = ownerJid.includes("@") ? ownerJid : `${ownerJid}@s.whatsapp.net`;
        await sock.sendMessage(ownerFull, {
          text: `🚨 Anti-Bad detected\nGroup: ${from}\nUser: @${username}\nWarns: ${db.warns[sender] || 0}\nMsg: ${text.slice(0, 600)}`,
          mentions: [sender]
        }).catch(() => null);
      }
    }

  } catch (err) {
    console.error("Anti-Bad Error:", err);
  }
}

// Command toggle and management
smd({
  pattern: "antibad",
  fromMe: true,
  desc: "⚙️ Toggle Anti-Bad language ON/OFF or view/reset warns",
}, async (msg, args, sock) => {
  try {
    const from = msg.key.remoteJid;
    if (!from?.endsWith?.("@g.us")) return msg.send("❌ This command works only in groups!");

    const db = loadDB();
    const cmd = (args[0] || "").toLowerCase();

    if (cmd === "on") {
      db.groups[from] = true;
      saveDB(db);
      return msg.send("✅ Anti-Bad enabled for this group.");
    }
    if (cmd === "off") {
      db.groups[from] = false;
      saveDB(db);
      return msg.send("⚠️ Anti-Bad disabled for this group.");
    }
    if (cmd === "warns") {
      // show warns for replied user or for all in group
      const reply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (reply) {
        const target = msg.message.extendedTextMessage.contextInfo.participant;
        const count = (db.warns[target] || 0);
        return msg.send(`👤 @${target.split("@")[0]} — warns: ${count}`, { mentions: [target] });
      } else {
        // show current group's warn summary (compact)
        const groupWarns = Object.entries(db.warns)
          .filter(([k]) => k.includes(from.split("@")[0]))
          .slice(0, 30)
          .map(([k, v]) => `@${k.split("@")[0]}: ${v}`).join("\n") || "No warns recorded.";
        return msg.send(`⚠️ Warns in this bot:\n${groupWarns}`);
      }
    }
    if (cmd === "reset") {
      // reset warns for replied user
      const reply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (!reply) return msg.send("⚠️ Reply to a user's message to reset their warns.");
      const target = msg.message.extendedTextMessage.contextInfo.participant;
      db.warns[target] = 0;
      saveDB(db);
      return msg.send(`✅ Warns reset for @${target.split("@")[0]}`, { mentions: [target] });
    }

    // default help text
    return msg.send("💡 Usage:\n*antibad on* — enable\n*antibad off* — disable\n*antibad warns* — view warns\n*antibad reset* — reset warns (reply)");
  } catch (err) {
    console.error("AntiBad command error:", err);
    await msg.send("❌ Error processing antibad command.");
  }
});

// Internal hook: run on every message
smd({
  pattern: "message",
  fromMe: false,
  desc: "Internal hook for Anti-Bad Language",
}, async (msg, args, client) => {
  await handleAntiBad(client, msg);
});
