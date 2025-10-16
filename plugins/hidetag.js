const { smd } = require("../index");

smd({
  pattern: "hidetag",
  fromMe: true,
  desc: "🕵️ Send a message to everyone without showing mentions"
}, async (msg, args, client) => {
  const from = msg.key.remoteJid;
  if (!from.endsWith("@g.us")) return msg.send("❌ Hii command ni kwa group tu!");

  const text = args.join(" ");
  if (!text) return msg.send("⚠️ Andika kitu cha kutuma. Mfano: *hidetag Hello all!*");

  try {
    const groupMetadata = await client.groupMetadata(from);
    const participants = groupMetadata.participants.map(p => p.id);

    await client.sendMessage(from, {
      text: text,
      mentions: participants // includes everyone but no visible tag
    });

    await msg.send("✅ Hidetag sent!\n🏷️ OMMY-MD 💥");
  } catch (e) {
    console.error("Hidetag Error:", e);
    await msg.send("❌ Tatizo kutuma hidetag.");
  }
});
