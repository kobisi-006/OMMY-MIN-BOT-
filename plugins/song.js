const { smd } = require('../lib/smd');
const axios = require('axios');
const qs = require('querystring');

// Load env variables
const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  REDIRECT_URI
} = process.env;

async function getSpotifyToken() {
  const tokenResponse = await axios.post(
    'https://accounts.spotify.com/api/token',
    qs.stringify({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      }
    }
  );
  return tokenResponse.data.access_token;
}

smd({
  pattern: 'song',
  fromMe: false,
  desc: '🎧 Search and play a Spotify song preview'
}, async (message, match, client) => {
  try {
    const query = match || message.reply_message?.text;
    if (!query)
      return await message.reply('🎵 Please provide song name.\nExample: *!song calm down by selena gomez*');

    await message.react('🎶');

    const token = await getSpotifyToken();
    const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
    const res = await axios.get(searchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const track = res.data.tracks.items[0];
    if (!track) return await message.reply('❌ No song found on Spotify.');

    const caption = `
🎧 *${track.name}*
👩‍🎤 *Artist:* ${track.artists.map(a => a.name).join(', ')}
💿 *Album:* ${track.album.name}
🕒 *Duration:* ${(track.duration_ms / 60000).toFixed(2)} mins
🔗 *URL:* ${track.external_urls.spotify}
`;

    if (track.preview_url) {
      await client.sendMessage(message.jid, {
        audio: { url: track.preview_url },
        mimetype: 'audio/mpeg',
        caption
      }, { quoted: message });
    } else {
      await message.reply(caption + '\n⚠️ No audio preview available.');
    }

    await message.react('✅');
  } catch (err) {
    console.error('Error in Spotify command:', err);
    await message.reply('❌ Error fetching song. Check your Spotify keys.');
  }
});
