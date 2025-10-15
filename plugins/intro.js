// plugins/intro.js
const { smd } = require("../index");
const os = require("os");

smd({
  pattern: "intro",
  fromMe: false,
  desc: "💫 Display bot’s stylish introduction with profile picture, uptime, and greetings."
}, async (message, match, { sock }) => {
  try {
    const botJid = sock.user?.id || sock.user?.jid;
    if (!botJid) return await message.send("❌ Bot JID not found. Please restart the bot.");

    // 🖼️ Get bot’s profile picture
    let pfp;
    try {
      pfp = await sock.profilePictureUrl(botJid, "image");
    } catch {
      pfp = "https://telegra.ph/file/1e60489705c851f74b55e.jpg";
    }

    // 🕒 Time & greeting
    const time = new Date();
    const hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, "0");
    const date = time.toLocaleDateString();
    let greeting;

    if (hours < 5) greeting = "🌃 Midnight Coder Mode";
    else if (hours < 12) greeting = "🌅 Good Morning";
    else if (hours < 17) greeting = "🌞 Good Afternoon";
    else if (hours < 20) greeting = "🌇 Good Evening";
    else greeting = "🌙 Good Night";

    // 🧮 Bot uptime
    const uptimeSec = process.uptime();
    const uptimeH = Math.floor(uptimeSec / 3600);
    const uptimeM = Math.floor((uptimeSec % 3600) / 60);
    const uptimeS = Math.floor(uptimeSec % 60);
    const uptime = `${uptimeH}h ${uptimeM}m ${uptimeS}s`;

    // ⚙️ Bot info
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

    // 🖼️ Send the fancy message
    await sock.sendMessage(message.msg.key.remoteJid, {
      image: { url: pfp },
      caption,
    }, { quoted: message.msg });

  } catch (err) {
    console.error("❌ Intro command error:", err);
    await message.send("⚠️ Failed to display intro. Try again later.");
  }
});
