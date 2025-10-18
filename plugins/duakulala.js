// plugins/duakulala.js
const { smd } = require("../index");

smd({
  pattern: "duakulala",
  fromMe: false,
  desc: "🌙 Send Dua for sleeping",
}, async (msg, args, client) => {
  const dua = `🌙 *Dua ya Kulala* 🌙

بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا
*Bismika Allahumma amootu wa ahyaa.*

💡 Tafsiri:
"Kwa jina Lako Ee Allah, nitaishi na nitakufa."`;

  await msg.send(dua);
});
