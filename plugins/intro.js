const { smd } = require('../lib/smd');
const os = require('os');

smd({
  pattern: "intro",
  fromMe: false,
  desc: "💫 Display bot’s stylish introduction with profile picture, uptime, and greetings."
}, async (message, args, client) => {
  try {
    const botJid = client.user?.id || client.user?.jid;
    if (!botJid) return await client.sendMessage(message.key.remoteJid, { text: "❌ Bot JID not found. Please restart the bot." });

    // Get profile picture
    let pfp;
    try {
      pfp = await client.profilePictureUrl(botJid, "image");
    } catch {
      pfp = "https://telegra.ph/file/1e60489705c851f74b55e.jpg";
    }

    const time = new Date();
    const hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const date = time.toLocaleDateString();

    let greeting;
    if (hours < 5) greeting = "🌃 Midnight Coder Mode";
    else if (hours < 12) greeting = "🌅 Good Morning";
    else if (hours < 17) greeting = "🌞 Good Afternoon";
    else if (hours < 20) greeting = "🌇 Good Evening";
    else greeting = "🌙 Good Night";

    const uptimeSec = process.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);
    const uptimeS = Math.floor(uptimeSec % 60);
    const uptime = `${uptimeH}h ${uptimeM}m ${uptimeS}s`;

    const caption = `
╭─────────────◆
│ ${greeting} 🌍
│
│ 🤖 *Bot Name:* BEN WHITTAKER TECH
│ 👑 *Owner:* Ommy 3 Blif
│ 🧠 *Runtime:* ${uptime}
│ 🖥️ *Platform:* ${os.platform()}
│ 🏠 *Host:* ${os.hostname()}
│ ⏰ *Time:* ${hours}:${minutes}
│ 📅 *Date:* ${date}
╰────────────────◆`;

    await client.sendMessage(message.key.remoteJid, {
      image: { url: pfp },
      caption: caption
    }, { quoted: message });

  } catch (err) {
    console.error("❌ Intro command error:", err);
    await client.sendMessage(message.key.remoteJid, { text: "⚠️ Failed to display intro." });
  }
});
