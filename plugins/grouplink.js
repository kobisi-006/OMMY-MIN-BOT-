// plugins/grouplink.js
const { smd } = require('../lib/smd');

smd({
  pattern: 'grouplink',
  fromMe: true,
  desc: '🔗 Get the group invite link with fancy decoration'
}, async (message, match, client) => {
  try {
    const metadata = await client.groupMetadata(message.jid);
    if (!metadata) return await message.reply("⚠️ This command works only in groups.");

    const inviteCode = metadata.inviteCode || null;
    if (!inviteCode) return await message.reply("❌ Cannot fetch group link. Make sure bot is admin.");

    const link = `https://chat.whatsapp.com/${inviteCode}`;
    const text = `
╭─✦ Group Link ✦─╮
│ 🏷️ *Group Name:* ${metadata.subject}
│ 👥 *Members:* ${metadata.participants.length}
│ 🔗 *Invite Link:* ${link}
╰─────────────────╯
✨ *Shared via OMMY-MIN-BOT*`;

    await client.sendMessage(message.jid, { text });
    await message.react("🔗");
  } catch (err) {
    console.error("GroupLink Error:", err);
    await message.reply("❌ Failed to get group link.");
  }
});
