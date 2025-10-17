//═══════════════════════════════════════════════//
// 💠 OMMY-MD PRO TAGALL
// 👑 Developer: Ben Whittaker
// 🌐 Function: Tag everyone in a beautiful style
//═══════════════════════════════════════════════//

module.exports = {
  name: "tagall",
  description: "📢 Mention all group members in a stylish format",

  async execute(sock, m, args) {
    try {
      const from = m.key.remoteJid;
      if (!from.endsWith("@g.us"))
        return m.reply("⚠️ Hii command inafanya kazi kwenye group pekee!");

      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants.map((p) => p.id);
      const sender = m.pushName || "👤 Anonymous";
      const message = args.join(" ") || "📢 Announcement kwa wote!";

      // 💫 Auto React before sending
      await sock.sendMessage(from, {
        react: { text: "🚀", key: m.key },
      });

      // 🌈 Stylish decorated announcement
      const caption = `
╭───────────────❖───────────────╮
│    💎 *OMMY-MD GLOBAL TAG SYSTEM* 💎
│───────────────────────────────
│ 👑 *From:* ${sender}
│ 💬 *Message:* ${message}
│
│ 👥 *Total Members:* ${participants.length}
│ 🔔 *Mode:* Public Tag (Visible Mentions)
│
│ 🧠 *Note:* Respect the chat rules ⚠️
│───────────────────────────────
│ 💠 *Powered by:* ᴏᴍᴍʏ-ᴍᴅ ʙʀᴀɴᴅ™
│ ✨ *Innovation in Every Command*
╰───────────────────────────────╯
`;

      // 🛰️ Send message with public mentions
      await sock.sendMessage(from, {
        text: caption,
        mentions: participants,
      });

    } catch (err) {
      console.error("❌ TAGALL Error:", err);
      await sock.sendMessage(m.key.remoteJid, {
        text: "⚠️ Error occurred while tagging everyone.",
      });
    }
  },
};
