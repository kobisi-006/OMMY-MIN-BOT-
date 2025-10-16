const { smd } = require("../lib/smd");

const autoKick = true; // true = kick on 4th/5th offense
const warnMsg = `
🚨 *ANTI-LINK ALERT!* 🚨
Ujumbe wako umetambuliwa kama *link* isiyoruhusiwa!
Tafadhali usitumie link tena, vinginevyo utatolewa kwenye group!`;

global.antilink = global.antilink || {};
global.antilinkWarns = global.antilinkWarns || {}; // { groupId: { userId: count } }

// ==============================
// COMMAND: *antilink on/off
// ==============================
smd({
  pattern: "antilink",
  fromMe: true,
  desc: "Enable or disable Anti-Link mode in groups"
}, async (msg, args, client) => {
  const option = args[0]?.toLowerCase();
  const from = msg.key.remoteJid;

  if (!from.endsWith("@g.us"))
    return msg.reply("❌ Command hii inafanya kazi kwenye *Groups* pekee.");

  if (!option)
    return msg.reply("⚙️ Usage: *antilink on/off*");

  if (option === "on") {
    global.antilink[from] = true;
    await msg.react("✅");
    return msg.reply(`
🛡️ *Successfully Mode AntiLink Activated!*
From now, all unwanted links will be deleted automatically ⚔️
`);
  }

  if (option === "off") {
    global.antilink[from] = false;
    await msg.react("🚫");
    return msg.reply(`
❌ *AntiLink Mode Deactivated!*
Links are now allowed in this group 🌐
`);
  }

  return msg.reply("⚙️ Usage: *antilink on/off*");
});

// ==============================
// AUTO-DETECT LINKS & WARN
// ==============================
smd({
  on: "message"
}, async (msg, args, client) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return; // Only groups
    if (!global.antilink[from]) return;  // Skip if off

    const userId = msg.key.participant;
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";

    const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|telegram\.me|t\.me|instagram\.com|facebook\.com|youtube\.com)/i;
    if (!linkRegex.test(body)) return;

    // Delete message
    await client.sendMessage(from, { delete: msg.key });

    // Init group warn counter
    global.antilinkWarns[from] = global.antilinkWarns[from] || {};
    global.antilinkWarns[from][userId] = (global.antilinkWarns[from][userId] || 0) + 1;

    const warns = global.antilinkWarns[from][userId];

    // Send warning
    await msg.reply(`${warnMsg}\n⚠️ You have ${warns} warn(s)`);

    // Kick if exceeds 3 warns (4th or 5th offense)
    if (autoKick && warns >= 4) {
      await client.groupParticipantsUpdate(from, [userId], "remove");
      await client.sendMessage(from, {
        text: `👢 @${userId.split("@")[0]} ameondolewa baada ya kutuma link mara ${warns}`,
        mentions: [userId]
      });
      // Reset warn
      global.antilinkWarns[from][userId] = 0;
    }

  } catch (e) {
    console.log("❌ AntiLink Error:", e);
  }
});
