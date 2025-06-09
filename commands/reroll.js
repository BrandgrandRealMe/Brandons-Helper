import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../database/giveawayDB.js';

export const data = new SlashCommandBuilder()
  .setName('reroll')
  .setDescription('Reroll a past giveaway')
  .addStringOption(opt =>
    opt.setName('giveaway_id').setDescription('The ID of the giveaway').setRequired(true)
  );

export async function execute(interaction) {
  const giveawayId = interaction.options.getString('giveaway_id');

  const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
  if (!giveaway) {
    return interaction.reply({ content: '❌ Giveaway not found.', ephemeral: true });
  }

  const entrants = db.prepare('SELECT user_id FROM entries WHERE giveaway_id = ?').all(giveawayId);
  if (!entrants.length) {
    return interaction.reply({ content: '❌ No entries found for that giveaway.', ephemeral: true });
  }

  const winners = entrants
    .sort(() => 0.5 - Math.random())
    .slice(0, giveaway.winner_count)
    .map(row => `<@${row.user_id}>`);

  const embed = new EmbedBuilder()
    .setTitle('🎉 Giveaway Rerolled!')
    .setDescription(`**Prize:** ${giveaway.prize}\n**New Winner(s):** ${winners.join(', ')}`)
    .setColor('Green');

  return interaction.reply({ embeds: [embed] });
}
