const { smd } = require("../index");

smd({
  pattern: "kick",
  fromMe: true,
  desc: "👑 Kick one user by reply",
}, async (msg, args, sock) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us"))
      return msg.send("❌ *This command works only in groups!*");

    const metadata = await sock.groupMetadata(from);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const senderNumber = msg.key.participant || msg.key.remoteJid;

    const botParticipant = metadata.participants.find(p => p.id === botNumber);
    const senderParticipant = metadata.participants.find(p => p.id === senderNumber);

    const isBotAdmin = botParticipant?.admin !== null && botParticipant?.admin !== undefined;
    const isSenderAdmin = senderParticipant?.admin !== null && senderParticipant?.admin !== undefined;

    if (!isBotAdmin) return msg.send("❌ *I need admin rights to kick members!*");
    if (!isSenderAdmin) return msg.send("⚠️ *You must be admin to use this command!*");

    // Get the target from reply
    const replyMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!replyMsg) return msg.send("⚠️ *Reply to the user you want to kick!*");

    const target = msg.message.extendedTextMessage.contextInfo.participant;
    const participant = metadata.participants.find(p => p.id === target);
    if (participant?.admin !== null && participant?.admin !== undefined)
      return msg.send("⚠️ *Cannot kick an admin!*");

    // Kick the user
    await sock.groupParticipantsUpdate(from, [target], "remove");

    // Send result
    const text = `
╭─🚷 *KICK SUCCESS* 🚷─╮
│ ✅ Kicked: @${target.split("@")[0]}
╰───────────────────╯
💎 *OMMY-MD BOT*
    `;
    await sock.sendMessage(from, { text, mentions: [target] });

  } catch (e) {
    console.error("❌ Kick Command Error:", e);
    await msg.send("❌ *Failed to kick user!*");
  }
});
