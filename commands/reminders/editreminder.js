// commands/reminder/editreminder.js
import { SlashCommandBuilder } from 'discord.js';
import db from '../../database/reminderDB.js';
import { scheduleReminder } from '../../utils/scheduler.js';

export const data = new SlashCommandBuilder()
  .setName('editreminder')
  .setDescription('Edit an existing reminder')
  .addStringOption(opt =>
    opt.setName('id')
      .setDescription('Reminder ID')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('message')
      .setDescription('New reminder message')
      .setRequired(false)
  )
  .addIntegerOption(opt =>
    opt.setName('duration')
      .setDescription('New time (in seconds from now)')
      .setRequired(false)
  );

export async function execute(interaction) {
  const id = interaction.options.getString('id');
  const newMessage = interaction.options.getString('message');
  const newDuration = interaction.options.getInteger('duration');
  const reminder = db.prepare('SELECT * FROM reminders WHERE id = ? AND reminded = 0').get(id);

  if (!reminder) {
    return interaction.reply({ content: '⚠️ Reminder not found or already sent.', ephemeral: true });
  }

  if (reminder.user_id !== interaction.user.id) {
    return interaction.reply({ content: '❌ You can only edit your own reminders.', ephemeral: true });
  }

  const updatedFields = {};
  if (newMessage) updatedFields.message = newMessage;
  if (newDuration) updatedFields.remind_at = Date.now() + newDuration * 1000;

  const queryParts = [];
  const values = [];

  for (const key in updatedFields) {
    queryParts.push(`${key} = ?`);
    values.push(updatedFields[key]);
  }

  if (queryParts.length === 0) {
    return interaction.reply({ content: '❗ Provide at least one thing to update.', ephemeral: true });
  }

  values.push(id);
  db.prepare(`UPDATE reminders SET ${queryParts.join(', ')} WHERE id = ?`).run(...values);

  // Re-schedule the updated reminder if time was changed
  if (newDuration) {
    scheduleReminder(interaction.client, id, newDuration * 1000);
  }

  await interaction.reply({
    content: `✅ Reminder \`${id}\` updated!`,
    ephemeral: true
  });
}
