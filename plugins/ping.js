const { smd } = require("../index");
const os = require("os");

smd(
  {
    pattern: "ping",
    desc: "💎 Check bot speed and system performance",
  },
  async (ctx) => {
    const start = Date.now();
    await ctx.send("🏓 *Pinging...*");
    const latency = Date.now() - start;

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const platform = os.platform().toUpperCase();
    const cpuModel = os.cpus()[0].model;

    const msg = `
╭───💠 *OMMY-MIN-BOT STATUS* 💠───╮
│
│ ⚡ *Ping:* ${latency} ms
│ 🕐 *Uptime:* ${hours}h ${minutes}m ${seconds}s
│ 💾 *RAM:* ${freeMem} GB free / ${totalMem} GB total
│ 💻 *System:* ${platform}
│ 🧠 *CPU:* ${cpuModel.slice(0, 20)}...
│ 👑 *Owner:* ${global.Config.owner}
│ 🤖 *Bot:* ${global.Config.caption}
│
╰────────────────────────────╯
`;

    await ctx.send(msg);
  }
);
