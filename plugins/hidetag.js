//═══════════════════════════════════════════════//
// 💠 OMMY-MD ULTRA PRO HIDETAG
// 👑 Developer: Ben Whittaker
// 🧠 Function: Silent broadcast with hidden mentions
//═══════════════════════════════════════════════//

module.exports = {
  name: "hidetag",
  description: "💠 Send a stylish hidden tag message to all group members",
  
  async execute(sock, m, args) {
    try {
      const from = m.key.remoteJid;
      if (!from.endsWith("@g.us"))
        return m.reply("⚠️ This command only works in groups!");

      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map((p) => p.id);
      const sender = m.pushName || "👤 Anonymous";
      const text = args.join(" ") || "✨ No message provided!";

      // 💫 Auto React
      await sock.sendMessage(from, {
        react: { text: "💫", key: m.key },
      });

      // 🌈 Stylish OMMY-MD Decorated Message
      const caption = `
╭───❖ 🌐 *OMMY-MD HIDETAG SYSTEM* ❖───╮
│
│ 🧠 *From:* ${sender}
│ 💬 *Message:* ${text}
│
│ ⚙️ *Mode:* Hidden Tag (All Members)
│ 🕶️ *Visibility:* Mentions only
│
╰───────────────────────────────╯
💠 *Powered By:* ᴏᴍᴍʏ-ᴍᴅ ʙʀᴀɴᴅ™
✨ *Innovation in Every Command* ✨
`;

      // 🛰️ Send message tagging all silently
      await sock.sendMessage(from, {
        text: caption,
        mentions: participants,
      });

    } catch (err) {
      console.error("❌ HIDETAG Error:", err);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Error while sending hidden tag message.",
      });
    }
  },
};
