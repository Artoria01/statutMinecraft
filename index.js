const ms = require('ms')
const fetch = require('node-fetch')
const Discord = require('discord.js')
const client = new Discord.Client()

const config = require('./config.json')

/**
 * This function is used to update statistics channel
 */
const updateChannel = async () => {

    // Fetch statistics from mcapi.us
    const res = await fetch(`https://mcapi.us/server/status?ip=${config.ipAddress}${config.port ? `&port=${config.port}` : ''}`)
    if (!res) {
        const statusChannelName = `【📡】Status: Hors ligne`
        client.channels.cache.get(config.statusChannel).setName(statusChannelName)
        return false
    }
    // Parse the mcapi.us response
    const body = await res.json()

    // Get the current player count, or set it to 0
    const players = body.players.now

    // Get the server status
    const status = (body.online ? "En ligne" : "Hors ligne")

    // Generate channel names
    const playersChannelName = `【⛄】Joueurs: ${players}`
    const statusChannelName = `【📡】Status: ${status}`

    // Update channel names
    client.channels.cache.get(config.playersChannel).setName(playersChannelName)
    client.channels.cache.get(config.statusChannel).setName(statusChannelName)

    return true
}

client.on('ready', () => {
    console.log(`Ready. Logged as ${client.user.tag}.`)
    setInterval(() => {
        updateChannel()
    }, ms(config.updateInterval))
})

client.on('message', async (message) => {

    if(message.content === `${config.prefix}force-update`){
        if (!message.member.hasPermission('MANAGE_MESSAGES')) {
            return message.channel.send('Seuls les modérateurs du serveur peuvent exécuter cette commande !')
        }
        const sentMessage = await message.channel.send("Mise à jour des salons, veuillez patienter...")
        await updateChannel()
        sentMessage.edit("Les salons ont été mises à jour avec succès!")
    }

    if(message.content === `${config.prefix}stats`){
        const sentMessage = await message.channel.send("Récupération des statistiques, veuillez patienter...")

        // Fetch statistics from mcapi.us
        const res = await fetch(`https://mcapi.us/server/status?ip=${config.ipAddress}${config.port ? `&port=${config.port}` : ''}`)
        if (!res) return message.channel.send(`Il semble que votre serveur ne soit pas accessible... Veuillez vérifier qu'il est en ligne et qu'il ne bloque pas l'accès!`)
        // Parse the mcapi.us response
        const body = await res.json()

        const attachment = new Discord.MessageAttachment(Buffer.from(body.favicon.substr('data:image/png;base64,'.length), 'base64'), "icon.png")

        const embed = new Discord.MessageEmbed()
            .setAuthor(config.ipAddress)
            .attachFiles(attachment)
            .setThumbnail("attachment://icon.png")
            .addField("Version", body.server.name)
            .addField("Connectés", `${body.players.now} joueurs`)
            .addField("Maximum", `${body.players.max} joueurs`)
            .addField("Status", (body.online ? "En ligne" : "Hors ligne"))
            .setColor("#FF0000")
            .setFooter("Open Source Minecraft Discord Bot")
        
        sentMessage.edit(`:chart_with_upwards_trend: Voici les statistiques de **${config.ipAddress}**:`, { embed })
    }

})

client.login(process.env.TOKEN)
