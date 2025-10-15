// plugins/admins.js
const { smd } = require('../lib/smd');

smd({
  pattern: 'admins',
  fromMe: false,
  desc: '👑 List all group admins with fancy decoration'
}, async (message, match, client) => {
  try {
    await message.react('👀'); // reaction while processing

    const chatId = message.jid;
    const groupMetadata = await client.groupMetadata(chatId);
    const participants = groupMetadata.participants || [];

    // Filter admins
    const admins = participants.filter(p => p.admin !== null);

    if (admins.length === 0)
      return await message.reply("⚠️ No admins found in this group!");

    let text = `╭─🌟 *Group Admins List* 🌟─\n`;
    admins.forEach((admin, index) => {
      const number = admin.id.split('@')[0];
      text += `│ ${index + 1}. 👑 @${number}\n`;
    });
    text += `╰───────────────────\n`;
    text += `✨ Total Admins: ${admins.length}`;

    // Send message with mentions
    const mentions = admins.map(a => a.id);
    await client.sendMessage(chatId, { text, mentions }, { quoted: message });

    await message.react('✅'); // success emoji
  } catch (err) {
    console.error("Admin list command error:", err);
    await message.reply("❌ Failed to fetch admins. Make sure this is a group.");
  }
});
