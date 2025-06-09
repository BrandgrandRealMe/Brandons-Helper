import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import db from '../../database/todoDB.js';
import crypto from 'crypto';

export const data = new SlashCommandBuilder()
  .setName('todo')
  .setDescription('Manage your to-do list')
  .addSubcommand(sub =>
    sub.setName('add')
      .setDescription('Add a task')
      .addStringOption(opt => opt.setName('task').setDescription('Task description').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('list')
      .setDescription('List your tasks')
  )
  .addSubcommand(sub =>
    sub.setName('done')
      .setDescription('Mark a task as done')
      .addStringOption(opt => opt.setName('taskid').setDescription('Task ID').setRequired(true))
  )
  .addSubcommand(sub =>
    sub.setName('delete')
      .setDescription('Delete a task')
      .addStringOption(opt => opt.setName('taskid').setDescription('Task ID').setRequired(true))
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  if (interaction.options.getSubcommand() === 'add') {
    const task = interaction.options.getString('task');
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO todos (id, user_id, task, done) VALUES (?, ?, ?, 0)').run(id, userId, task);
    await interaction.reply(`✅ Added task: "${task}" (ID: ${id})`);
  } else if (interaction.options.getSubcommand() === 'list') {
    const tasks = db.prepare('SELECT id, task, done FROM todos WHERE user_id = ?').all(userId);
    if (tasks.length === 0) return interaction.reply('You have no tasks.');
    const embed = new EmbedBuilder().setTitle(`${interaction.user.username}'s To-Do List`).setColor('Green');
    tasks.forEach(t => {
      embed.addFields({ name: `ID: ${t.id} [${t.done ? '✔️' : '❌'}]`, value: t.task });
    });
    await interaction.reply({ embeds: [embed] });
  } else if (interaction.options.getSubcommand() === 'done') {
    const taskId = interaction.options.getString('taskid');
    const task = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!task) return interaction.reply('Task not found or not yours.');
    db.prepare('UPDATE todos SET done = 1 WHERE id = ?').run(taskId);
    await interaction.reply(`✅ Marked task as done: "${task.task}"`);
  } else if (interaction.options.getSubcommand() === 'delete') {
    const taskId = interaction.options.getString('taskid');
    const task = db.prepare('SELECT * FROM todos WHERE id = ? AND user_id = ?').get(taskId, userId);
    if (!task) return interaction.reply('Task not found or not yours.');
    db.prepare('DELETE FROM todos WHERE id = ?').run(taskId);
    await interaction.reply(`🗑️ Deleted task: "${task.task}"`);
  }
}
