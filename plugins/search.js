const { smd } = require('../lib/smd');
const axios = require('axios');

const SERPAPI_KEY = "6084018373e1103ad98c592849e59eb1f0abf4a5996841a2ba78a6c9c70c9058";

smd({
    pattern: "search",
    fromMe: false,
    desc: "🔍 Search Google using SerpAPI"
}, async (message, match, client) => {
    try {
        const query = match || message.reply_message?.text;
        if (!query) return await message.send("❌ Usage: *!search your query here*");

        // React emoji to indicate processing
        await message.react("🔎");

        const response = await axios.get("https://serpapi.com/search.json", {
            params: {
                q: query,
                api_key: SERPAPI_KEY,
                engine: "google",
                num: 3
            }
        });

        const results = response.data.organic_results;
        if (!results || results.length === 0) {
            return await message.send("❌ No results found for your query.");
        }

        let text = `🔎 *Top Google Results for:* "${query}"\n\n`;
        results.forEach((res, i) => {
            text += `📌 ${i + 1}. ${res.title}\n🌐 ${res.link}\n\n`;
        });

        // Send results
        await client.sendMessage(message.jid, { text }, { quoted: message });
        await message.react("✅"); // success emoji

    } catch (err) {
        console.error("SerpAPI Error:", err.response?.data || err);
        await message.send("❌ Something went wrong while searching.");
    }
});
