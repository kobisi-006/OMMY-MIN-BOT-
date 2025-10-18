module.exports = {
  name: "duakuamka",
  description: "🌅 Dua ya kuamka kutoka usingizini",
  async execute(sock, m) {
    const dua = `
🌅 *DUA YA KUAMKA* 🌅

الْـحَمْدُ لِلّٰهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ  
*Alhamdu lillaahil-ladhi ahyaanaa ba'da maa amaatanaa wa ilayhin-nushoor.*

💬 Maana: “Sifa njema zote ni za Mwenyezi Mungu, ambaye ametufufua baada ya kutulaza, na kwake ndiko marejeo.”

☀️ _Soma dua hii unapofumbua macho asubuhi._
`;
    await sock.sendMessage(m.key.remoteJid, { text: dua }, { quoted: m });
  }
};
