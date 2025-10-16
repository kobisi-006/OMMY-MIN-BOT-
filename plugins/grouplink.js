const { smd } = require("../index");

smd({
  pattern: "grouplink",
  fromMe: false,
  desc: "🔗 Show group invite link with decoration"
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  try {
    const groupMetadata = await client.groupMetadata(from);
    const inviteCode = await client.groupInviteCode(from);
    const participants = groupMetadata.participants.length;

    const decoratedMessage = `
╭─❮ 🔗 GROUP LINK ❯─☆
│ 🏷️ Group Name: ${groupMetadata.subject}
│ 👥 Members: ${participants}
│ 🌐 Invite Link:
│ https://chat.whatsapp.com/${inviteCode}
╰───────────────☆
🏷️ OMMY-MD 💥
    `;

    await msg.send(decoratedMessage);

  } catch (e) {
    console.error("GroupLink Error:", e);
    await msg.send("❌ Tatizo kupata group link!");
  }
});
