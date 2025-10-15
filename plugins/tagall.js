// plugins/tagall.js
const { smd } = require('../lib/smd');

smd({
  pattern: 'tagall',
  fromMe: true,
  desc: '📢 Mention all group members with fancy decoration'
}, async (message, match, client) => {
  try {
    const group = await client.groupMetadata(message.jid);
    const members = group.participants.map(p => p.id);
    const header = "╭───────────────✦\n│ 🔔 *ATTENTION ALL MEMBERS!* 🔔\n╰───────────────✦\n";
    const footer = "\n✨ *Sent via OMMY-MIN-BOT*";
    const text = match?.trim() ? `💬 ${match}\n` : "";
    
    await client.sendMessage(message.jid, {
      text: header + text + footer,
      mentions: members
    });

    await message.react("📣"); // reaction emoji
  } catch (err) {
    console.error("TagAll Error:", err);
    await message.reply("❌ Failed to tag all members.");
  }
});
