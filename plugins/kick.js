const { smd } = require("../index");

smd({
  pattern: "kick",
  fromMe: true,
  desc: "⚡ Kick a member from the group",
}, async (msg, args, sock) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return msg.send("❌ *This command works only in groups!*");

    const metadata = await sock.groupMetadata(from);
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const isBotAdmin = metadata.participants.some(p => p.id === botNumber && p.admin);

    if (!isBotAdmin) return msg.send("⚠️ *Bot is not admin, cannot kick anyone!*");

    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mentions || mentions.length === 0) return msg.send("⚠️ *Mention the user you want to kick!*");

    const target = mentions[0];

    await sock.groupParticipantsUpdate(from, [target], "remove");

    // Message decoration
    const text = `
╭─🚫 *USER KICKED* ──╮
│ 👤 *User:* @${target.split("@")[0]}
│ 👑 *Actioned by:* @${msg.key.participant?.split("@")[0] || "Owner"}
│ ⚡ *Bot:* OMMY-MD
╰────────────────╯
`;

    await sock.sendMessage(from, { text, mentions: [target] });
    await msg.react("✅");

  } catch (e) {
    console.error("❌ Kick Command Error:", e.message);
    await msg.send("❌ *Failed to kick user!*");
  }
});
