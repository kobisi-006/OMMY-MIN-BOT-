// plugins/hidetag.js
const { smd } = require('../lib/smd');

smd({
  pattern: 'hidetag',
  fromMe: true,
  desc: '👻 Send message without tagging anyone (hidden message)'
}, async (message, match, client) => {
  const text = match?.trim();
  if (!text) return await message.reply("⚠️ Usage: *hidetag your message here*");

  try {
    const decorated = `╭─✦ Hidden Message ✦─╮\n💬 ${text}\n╰───────────────────╯\n👻 *Sent via OMMY-MIN-BOT*`;
    await client.sendMessage(message.jid, { text: decorated, mentions: [] });
    await message.react("👻"); // reaction emoji
  } catch (err) {
    console.error("Hidetag Error:", err);
    await message.reply("❌ Failed to send hidetag message.");
  }
});
