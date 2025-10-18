// plugins/remove.js
const { smd, Config } = require("../index");

smd({
  pattern: "remove",
  fromMe: true,
  desc: "🚷 Remove one or multiple members from the group",
}, async (msg, args, client) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return msg.send("❌ This command works only in groups!");

    const metadata = await client.groupMetadata(from);
    const sender = msg.key.participant || msg.key.remoteJid;
    const botNumber = client.user.id.split(":")[0] + "@s.whatsapp.net";

    // Check if bot is admin
    const isBotAdmin = metadata.participants.some(p => p.id === botNumber && p.admin);
    if (!isBotAdmin) return msg.send("❌ I am not admin, cannot remove members.");

    // Check if replied message exists
    const reply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!reply) return msg.send("⚠️ Reply to a user's message to remove them.");

    const targets = [];
    // Check if multiple users are mentioned
    if (msg.message.extendedTextMessage.contextInfo.mentionedJid) {
      msg.message.extendedTextMessage.contextInfo.mentionedJid.forEach(t => targets.push(t));
    } else {
      targets.push(msg.message.extendedTextMessage.contextInfo.participant);
    }

    for (let target of targets) {
      const targetName = target.split("@")[0];
      const isTargetAdmin = metadata.participants.some(p => p.id === target && p.admin);
      if (isTargetAdmin) {
        await msg.send(`⚠️ Cannot remove admin @${targetName}`, { mentions: [target] });
        continue;
      }
      await client.groupParticipantsUpdate(from, [target], "remove");
      await msg.send(`🚷 User @${targetName} has been removed!\n🏷️ OMMY-MD 💥`, { mentions: [target] });
    }

  } catch (err) {
    console.error("Remove Error:", err);
    await msg.send("❌ Error executing remove command.");
  }
});
