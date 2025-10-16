const { smd } = require("../index");

smd({
  pattern: "tagall",
  fromMe: true,
  desc: "📢 Tag all members in the group (modern decorated style)"
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const text = args.join(" ");
  if (!text) return msg.send("⚠️ Andika message ya kutuma. Mfano: *tagall Hello everyone!*");

  try {
    const groupMetadata = await client.groupMetadata(from);
    const participants = groupMetadata.participants.map(p => p.id);

    // Construct decorated message
    const decoratedMessage = `
╭─❮ 📢 TAG ALL ❯─☆
│ 📝 Message:
│ ${text}
│
│ 💡 Total members: ${participants.length}
╰───────────────☆
🏷️ OMMY-MD 💥
    `;

    await client.sendMessage(from, {
      text: decoratedMessage,
      mentions: participants
    });

    await msg.send("✅ TagAll successfully sent!\n🏷️ OMMY-MD 💥");
  } catch (e) {
    console.error("TagAll Error:", e);
    await msg.send("❌ Tatizo kutuma tagall.");
  }
});
