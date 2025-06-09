import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import db from '../../database/pollDB.js';
import crypto from 'crypto';
import { schedulePollEnd } from '../../utils/scheduler.js';

export const data = new SlashCommandBuilder()
  .setName('poll')
  .setDescription('Create a poll')
  .addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true))
  .addStringOption(opt => opt.setName('options').setDescription('Comma-separated options').setRequired(true))
  .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in seconds').setRequired(true));

export async function execute(interaction) {
  const question = interaction.options.getString('question');
  const options = interaction.options.getString('options').split(',').map(o => o.trim()).filter(o => o.length > 0);
  const duration = interaction.options.getInteger('duration') * 1000;
  const pollId = crypto.randomUUID();
  const endTime = Date.now() + duration;

  if (options.length < 2 || options.length > 10) {
    return interaction.reply({ content: 'You must provide between 2 and 10 options.', ephemeral: true });
  }

  const buttons = new ActionRowBuilder();
  options.forEach((opt, idx) => {
    buttons.addComponents(
      new ButtonBuilder()
        .setCustomId(`pollvote_${pollId}_${idx}`)
        .setLabel(opt)
        .setStyle(ButtonStyle.Primary)
    );
  });

  const embed = new EmbedBuilder()
    .setTitle('📊 New Poll')
    .setDescription(`**${question}**`)
    .setColor('Blue')
    .setFooter({ text: `Ends in ${duration/1000} seconds. Poll ID: ${pollId}` })
    .setTimestamp(endTime);

  const msg = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

  db.prepare(`INSERT INTO polls (id, channel_id, message_id, question, options, end_time) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(pollId, interaction.channel.id, msg.id, question, JSON.stringify(options), endTime);

  schedulePollEnd(interaction.client, pollId, duration);
}
