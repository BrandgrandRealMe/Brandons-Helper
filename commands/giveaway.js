import {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
} from 'discord.js';
import db from '../database/giveawayDB.js';
import crypto from 'crypto';
import { scheduleGiveawayEnd } from '../utils/scheduler.js';


export const data = new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a giveaway')
    .addStringOption(opt =>
        opt.setName('prize').setDescription('The prize').setRequired(true)
    )
    .addIntegerOption(opt =>
        opt.setName('duration').setDescription('Duration in seconds').setRequired(true)
    )
    .addIntegerOption(opt =>
        opt.setName('winners').setDescription('Number of winners').setRequired(true)
    );

export async function execute(interaction) {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getInteger('duration') * 1000;
    const winnerCount = interaction.options.getInteger('winners');
    const endTime = Date.now() + duration;

    const giveawayId = crypto.randomUUID(); // generate a unique ID

    const joinButton = new ButtonBuilder()
        .setCustomId(`enter_${giveawayId}`)
        .setLabel('🎉 Join Giveaway')
        .setStyle(ButtonStyle.Success);

    const actionRow = new ActionRowBuilder().addComponents(joinButton);

    const embed = new EmbedBuilder()
        .setTitle('🎁 Giveaway!')
        .setDescription(`**Prize:** ${prize}\n**Hosted by:** <@${interaction.user.id}>\nClick below to enter!`)
        .setColor('Random')
        .setFooter({ text: `Ends in ${duration / 1000} seconds` })
        .setTimestamp(endTime);

    await interaction.reply({
        embeds: [embed],
        components: [actionRow],
    });
    const msg = await interaction.fetchReply();


    // Save to DB
    db.prepare(`
      INSERT INTO giveaways (id, channel_id, message_id, prize, host_id, end_time, winner_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(giveawayId, interaction.channel.id, msg.id, prize, interaction.user.id, endTime, winnerCount);

    // Schedule end
    scheduleGiveawayEnd(interaction.client, giveawayId, duration);
}
