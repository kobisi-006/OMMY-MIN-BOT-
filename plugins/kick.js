// plugins/kick.js
const { smd, Config } = require("../index");

smd({
  pattern: "kick",
  fromMe: true, // only owner can use
  desc: "🚷 Kick a member from the group (one by one)",
}, async (msg, args, client) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return msg.send("❌ This command works only in groups!");

    const metadata = await client.groupMetadata(from);
    const sender = msg.key.participant || msg.key.remoteJid;
    const botNumber = client.user.id.split(":")[0] + "@s.whatsapp.net";

    // Check if bot is admin
    const isBotAdmin = metadata.participants.some(p => p.id === botNumber && p.admin);
    if (!isBotAdmin) return msg.send("❌ I am not admin, cannot kick members.");

    // Check if user replied to someone
    const reply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!reply) return msg.send("⚠️ Reply to a user's message to kick them.");

    const target = msg.message.extendedTextMessage.contextInfo.participant;
    const targetName = target.split("@")[0];

    // Check if target is admin
    const isTargetAdmin = metadata.participants.some(p => p.id === target && p.admin);
    if (isTargetAdmin) return msg.send("⚠️ Cannot kick an admin.");

    // Kick user
    await client.groupParticipantsUpdate(from, [target], "remove");
    await msg.send(`🚷 User @${targetName} has been kicked successfully!\n🏷️ OMMY-MD 💥`, { mentions: [target] });

  } catch (err) {
    console.error("Kick Error:", err);
    await msg.send("❌ Error executing kick command.");
  }
});
