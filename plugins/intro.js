const { smd } = require('../lib/smd');

smd({
  pattern: "intro",
  fromMe: false,
  desc: "Show your bot intro with real WhatsApp profile picture"
}, async (message, match, client) => {
  try {
    const userJid = client.user?.id || client.user?.jid;
    if (!userJid) return await message.send("❌ Bot JID not found, please restart the bot.");

    // ✅ Fetch WhatsApp profile picture (auto)
    let pfp;
    try {
      pfp = await client.profilePictureUrl(userJid, "image");
    } catch {
      pfp = "https://telegra.ph/file/1e60489705c851f74b55e.jpg"; // fallback
    }

    // ✅ Dynamic greeting based on time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const date = now.toLocaleDateString();
    let wish = "🌙 Good Night";
    if (hours >= 0 && hours < 5) wish = "🌄 Early Morning";
    else if (hours >= 5 && hours < 12) wish = "⛅ Good Morning";
    else if (hours >= 12 && hours < 17) wish = "🌞 Good Afternoon";
    else if (hours >= 17 && hours < 20) wish = "🌥 Good Evening";

    // ✅ Bot Info
    const botName = "OMMY-MIN-BOT";
    const ownerName = "Ommy 3 Blif";
    const age = "22";
    const gender = "Male";
    const phone = "255624236654";
    const status = "WhatsApp Bot Developer";

    // ✅ Message body
    const intro = `
╭───❮ *🤖 BOT INTRO* ❯───☆
│ ${wish}
│ 👤 *Name:* ${botName}
│ 👨 *Owner:* ${ownerName}
│ 🎂 *Age:* ${age}
│ 🚹 *Gender:* ${gender}
│ ☎️ *Phone:* wa.me/${phone}
│ 💻 *Status:* ${status}
│ ⏰ *Time:* ${hours}:${minutes}
│ 📅 *Date:* ${date}
╰─────────────────────☆`;

    await message.client.sendMessage(message.jid, {
      image: { url: pfp },
      caption: intro
    }, { quoted: message });

  } catch (err) {
    console.error("Error in intro command:", err);
    await message.send("❌ Something went wrong while showing intro.");
  }
});
