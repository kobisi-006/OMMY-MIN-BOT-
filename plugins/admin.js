const { smd } = require("../index");

smd({
  pattern: "admins",
  fromMe: false,
  desc: "⚡ Show all group admins",
}, async (msg, args, sock) => {
  try {
    const from = msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return msg.send("❌ *This command works only in groups!*");

    const metadata = await sock.groupMetadata(from);
    const admins = metadata.participants
      .filter(p => p.admin)
      .map((p, i) => `│ ${i + 1}. @${p.id.split("@")[0]}`)
      .join("\n");

    if (!admins) return msg.send("⚠️ *No admins found in this group!*");

    const text = `
╭─👑 *GROUP ADMINS* ──╮
${admins}
╰────────────────╯
⚡ *OMMY-MD BOT*
`;

    await sock.sendMessage(from, { text, mentions: metadata.participants.filter(p => p.admin).map(p => p.id) });
    await msg.react("👑");

  } catch (e) {
    console.error("❌ Admins Command Error:", e.message);
    await msg.send("❌ *Failed to fetch admins!*");
  }
});
