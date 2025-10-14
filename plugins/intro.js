const { smd } = require('../lib/smd');
const os = require('os');

smd({
  pattern: "intro",
  fromMe: false,
  desc: "💫 Display bot’s stylish introduction with profile picture, uptime, and greetings."
}, async (message, match, client) => {
  try {
    const botJid = client.user?.id || client.user?.jid;
    if (!botJid) return await message.reply("❌ Bot JID not found. Please restart the bot.");

    // 🖼️ Try to get bot's real profile picture
    let pfp;
    try {
      pfp = await client.profilePictureUrl(botJid, "image");
    } catch {
      pfp = "https://telegra.ph/file/1e60489705c851f74b55e.jpg"; // fallback image
    }

    // 🕐 Greeting message by time
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

    // 🧮 Calculate bot uptime
    const uptimeSec = process.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);
    const uptimeS = Math.floor(uptimeSec % 60);
    const uptime = `${uptimeH}h ${uptimeM}m ${uptimeS}s`;

    // ⚙️ Bot & owner info (customize freely)
    const botInfo = {
      name: "🤖 BEN WHITTAKER TECH",
      owner: "👑 Ommy 3 Blif",
      gender: "🚹 Male",
      age: "22",
      phone: "255624236654",
      role: "💻 WhatsApp Bot Developer",
      platform: os.platform(),
      host: os.hostname(),
      version: "v10.8.3-stable",
    };

    // 🧾 Fancy intro text
    const caption = `
╭─────────────◆
│ ${greeting} 🌍
│
│ 🤖 *Bot Name:* ${botInfo.name}
│ 👑 *Owner:* ${botInfo.owner}
│ 🚹 *Gender:* ${botInfo.gender}
│ 🎂 *Age:* ${botInfo.age}
│ ☎️ *Phone:* wa.me/${botInfo.phone}
│ 💻 *Role:* ${botInfo.role}
│ 🧠 *Runtime:* ${uptime}
│ 🖥️ *Platform:* ${botInfo.platform}
│ 🏠 *Host:* ${botInfo.host}
│ ⚙️ *Version:* ${botInfo.version}
│ ⏰ *Time:* ${hours}:${minutes}
│ 📅 *Date:* ${date}
╰────────────────◆
🪄 *Ben Whittaker Tech AI System*`;

    // 🖼️ Send image + caption
    await client.sendMessage(message.jid, {
      image: { url: pfp },
      caption: caption
    }, { quoted: message });

  } catch (err) {
    console.error("❌ Intro command error:", err);
    await message.reply("⚠️ Failed to display intro. Try again later.");
  }
});
