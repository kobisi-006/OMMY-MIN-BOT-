// plugins/duakuamka.js
const { smd } = require("../index");

smd({
  pattern: "duakuamka",
  fromMe: false,
  desc: "🌅 Send Dua for waking up",
}, async (msg, args, client) => {
  const dua = `🌅 *Dua ya Kuamka* 🌅

اَلْحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ
*Alhamdu lillahi allathee ahyana ba'da ma amatana wa ilayhin-nushoor.*

💡 Tafsiri:
"Sifa zote ni za Allah, ambaye ametufufua baada ya kutufanya tuwe wafu, na kwa Yeye tutarejea."`;

  await msg.send(dua);
});
