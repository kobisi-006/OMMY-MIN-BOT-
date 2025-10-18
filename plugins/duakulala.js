module.exports = {
  name: "duakulala",
  description: "🌙 Dua ya kulala kabla ya usingizi",
  async execute(sock, m) {
    const dua = `
🌙 *DUA YA KULALA* 🌙

بِاسْمِكَ اللّٰهُمَّ أَحْيَا وَبِاسْمِكَ أَمُوتُ  
*Bismika Allahumma ahya wa bismika amut.*

💬 Maana: “Kwa jina lako ee Mwenyezi Mungu ninaishi, na kwa jina lako ninakufa (kulala).”

🕊️ _Soma dua hii kabla ya kulala._
`;
    await sock.sendMessage(m.key.remoteJid, { text: dua }, { quoted: m });
  }
};
