require("dotenv").config();
const { 
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]
});

// IDs das categorias do servidor
const ticketCategories = {
    suporte: "SUPORTE-ID-DA-CATEGORIA",
    financeiro: "FINANCEIRO-ID-DA-CATEGORIA",
    geral: "GERAL-ID-DA-CATEGORIA"
};

// Menu de tickets
client.once("ready", async () => {
    console.log(`🔥 Bot online como ${client.user.tag}`);
    
    const guild = client.guilds.cache.get("SEU_GUILD_ID");
    const canal = guild.channels.cache.get("ID_CANAL_DE_MENU");

    const embed = new EmbedBuilder()
        .setTitle("🎫 Abrir um Ticket")
        .setDescription("Selecione o tipo de ticket no menu abaixo.")
        .setColor("Green");

    const menu = new StringSelectMenuBuilder()
        .setCustomId("abrir_ticket")
        .setPlaceholder("Escolha o tipo de ticket")
        .addOptions([
            { label: "Suporte", value: "suporte", description: "Problemas técnicos ou dúvidas" },
            { label: "Financeiro", value: "financeiro", description: "Pagamentos, reembolsos" },
            { label: "Geral", value: "geral", description: "Outros assuntos" }
        ]);

    const row = new ActionRowBuilder().addComponents(menu);

    canal.send({ embeds: [embed], components: [row] });
});

// Interação do menu
client.on("interactionCreate", async interaction => {
    if (interaction.isStringSelectMenu() && interaction.customId === "abrir_ticket") {
        const tipo = interaction.values[0];
        const guild = interaction.guild;
        const user = interaction.user;

        try {
            const canal = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: ChannelType.GuildText,
                parent: ticketCategories[tipo],
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ]
            });

            await interaction.reply({ content: `🎫 Ticket criado: ${canal}`, ephemeral: true });
            await canal.send(`👋 Olá ${user}, explique seu problema e nossa equipe vai te ajudar!`);

            // Notificação para administradores
            guild.members.cache.forEach(member => {
                if (member.permissions.has(PermissionsBitField.Flags.Administrator) && !member.user.bot) {
                    member.send(`📌 Novo ticket aberto por ${user.tag} no canal ${canal}`).catch(() => {
                        console.log(`❌ Não foi possível enviar DM para ${member.user.tag}`);
                    });
                }
            });
        } catch (err) {
            console.error("❌ Erro ao criar ticket:", err);
            interaction.reply({ content: "❌ Não foi possível criar o ticket.", ephemeral: true });
        }
    }

    // Comando de fechar ticket
    if (interaction.isChatInputCommand() && interaction.commandName === "fechar") {
        const canal = interaction.channel;
        if (!canal.name.startsWith("ticket-")) return interaction.reply({ content: "❌ Este canal não é um ticket!", ephemeral: true });
        await interaction.reply("⏳ Fechando o ticket...");
        setTimeout(() => canal.delete().catch(console.error), 2000);
    }
});

client.login(process.env.TOKEN);
