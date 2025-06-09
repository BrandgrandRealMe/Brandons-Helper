// commands/reminder/deletereminder.js
import { SlashCommandBuilder } from 'discord.js';
import db from '../../database/reminderDB.js';

export const data = new SlashCommandBuilder()
  .setName('deletereminder')
  .setDescription('Delete a reminder')
  .addStringOption(opt =>
    opt.setName('id')
      .setDescription('Reminder ID to delete')
      .setRequired(true)
  );

export async function execute(interaction) {
  const id = interaction.options.getString('id');
  const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND reminded = 0').get(id);

  if (!reminder) {
    return interaction.reply({ content: '⚠️ Reminder not found or already sent.', ephemeral: true });
  }

  if (reminder.user_id !== interaction.user.id) {
    return interaction.reply({ content: '❌ You can only delete your own reminders.', ephemeral: true });
  }

  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
  await interaction.reply({ content: `🗑️ Reminder \`${id}\` deleted.`, ephemeral: true });
}
