const { smd } = require('../lib/smd');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 👇 weka key yako ya PDF.com hapa
const PDF_API_KEY = "tlextruder@gmail.com_ZF2YdZFxCbMdJrhfb3r4HSkddQj2kWrdEsIrDRQqeH17Ujit2BVG6poy7v54GRhM";

smd({
  pattern: "pdf",
  fromMe: false,
  desc: "📄 Convert text or message to a beautiful PDF file"
}, async (message, match, client) => {
  try {
    let text = match || message.reply_message?.text;
    if (!text)
      return await message.reply("📝 Please reply or type some text to convert into PDF.\n\nExample: *!pdf My new document*");

    await message.react("🕒");

    // === Convert Text to PDF via PDF.com API ===
    const response = await axios.post("https://api.pdf.com/v1/create", {
      content: text,
      title: "Ben Whittaker Tech Bot PDF",
      author: "Ben Whittaker Tech",
      style: "modern"
    }, {
      headers: {
        "Authorization": `Bearer ${PDF_API_KEY}`,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer"
    });

    // === Save file locally ===
    const pdfPath = path.join(__dirname, "../temp", `output_${Date.now()}.pdf`);
    fs.writeFileSync(pdfPath, response.data);

    // === Send file back ===
    await client.sendMessage(message.jid, {
      document: { url: pdfPath },
      mimetype: "application/pdf",
      fileName: "BenWhittakerTech.pdf",
      caption: "✅ *PDF generated successfully!*"
    }, { quoted: message });

    await message.react("✅");
  } catch (error) {
    console.error("PDF error:", error);
    await message.reply("❌ Failed to generate PDF. Check your API key or internet connection.");
  }
});
