const { smd } = require("../index");

smd({
  pattern: "remove",
  fromMe: true,
  desc: "👑 Kick a user from the group",
}, async (msg, args, sock) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us"))
      return msg.send("❌ *This command works only in groups!*");

    const replyMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!replyMsg) return msg.send("⚠️ *Reply to a user to remove them!*");

    const target = msg.message.extendedTextMessage.contextInfo.participant;

    // Get group metadata
    const metadata = await sock.groupMetadata(from);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    const botParticipant = metadata.participants.find(p => p.id === botNumber);
    const senderParticipant = metadata.participants.find(p => p.id === msg.key.participant);
    const targetParticipant = metadata.participants.find(p => p.id === target);

    const isBotAdmin = botParticipant?.admin !== null && botParticipant?.admin !== undefined;
    const isSenderAdmin = senderParticipant?.admin !== null && senderParticipant?.admin !== undefined;

    if (!isBotAdmin)
      return msg.send("❌ *I need to be an admin to remove members!*");

    if (!isSenderAdmin)
      return msg.send("⚠️ *You must be admin to use this command!*");

    if (targetParticipant?.admin !== null && targetParticipant?.admin !== undefined)
      return msg.send("⚠️ *Cannot remove another admin!*");

    await sock.groupParticipantsUpdate(from, [target], "remove");

    const text = `
╭─🚷 *USER REMOVED* 🚷─╮
│ 👤 @${target.split("@")[0]}
│ ✅ Successfully removed from group
╰─────────────────╯
💎 *OMMY-MD BOT*
`;
    await sock.sendMessage(from, { text, mentions: [target] });

  } catch (e) {
    console.error("❌ Remove Command Error:", e);
    await msg.send("❌ *Failed to remove user!*");
  }
});
