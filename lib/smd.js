// Simple command handler kwa OMMY-MIN-BOT
global.commands = global.commands || [];

function smd({ pattern, fromMe = false, desc = '' }, callback) {
    global.commands.push({ pattern, fromMe, desc, callback });
}

module.exports = { smd };
