// commands/reminder/myreminders.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../../database/reminderDB.js';

export const data = new SlashCommandBuilder()
  .setName('myreminders')
  .setDescription('View your upcoming reminders');

export async function execute(interaction) {
  const reminders = db.prepare(
    'SELECT * FROM reminders WHERE user_id = ? AND reminded = 0 ORDER BY remind_at ASC'
  ).all(interaction.user.id);

  if (!reminders.length) {
    return interaction.reply({ content: '📭 You have no active reminders.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('⏰ Your Reminders')
    .setColor('Blue')
    .setFooter({ text: 'Use /editreminder or /deletereminder with the ID below' });

  for (const r of reminders.slice(0, 10)) { // Discord limit: max 25 fields
    embed.addFields({
      name: `📝 ${r.message}`,
      value: `**ID:** \`${r.id}\`\n⏰ <t:${Math.floor(r.remind_at / 1000)}:R>`,
      inline: false
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
