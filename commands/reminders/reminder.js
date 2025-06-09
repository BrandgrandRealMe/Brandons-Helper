import {
    SlashCommandBuilder,
    EmbedBuilder,
} from 'discord.js';
import db from '../../database/reminderDB.js';  // You'll need a reminders table here
import crypto from 'crypto';
import { scheduleReminder } from '../../utils/scheduler.js';  // You'll implement this similar to giveaway scheduler

export const data = new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Set a reminder')
    .addStringOption(opt =>
        opt.setName('message')
            .setDescription('What do you want to be reminded about?')
            .setRequired(true)
    )
    .addIntegerOption(opt =>
        opt.setName('duration')
            .setDescription('When to remind you (seconds from now)')
            .setRequired(true)
    );

export async function execute(interaction) {
    const reminderMessage = interaction.options.getString('message');
    const duration = interaction.options.getInteger('duration') * 1000; // convert seconds to ms
    const remindAt = Date.now() + duration;

    const reminderId = crypto.randomUUID();

    const embed = new EmbedBuilder()
        .setTitle('⏰ Reminder Set!')
        .setDescription(`I will remind you: **${reminderMessage}**`)
        .setColor('Blue')
        .setFooter({ text: `Reminds in ${duration / 1000} seconds. ID: ${reminderId}` })
        .setTimestamp(remindAt);

    await interaction.reply({ embeds: [embed] });

    // Save reminder in database
    db.prepare(`
        INSERT INTO reminders (id, user_id, channel_id, message, remind_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(reminderId, interaction.user.id, interaction.channel.id, reminderMessage, remindAt);

    // Schedule the reminder with your scheduler utility
    scheduleReminder(interaction.client, reminderId, duration);
}
