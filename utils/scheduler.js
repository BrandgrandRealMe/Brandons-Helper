import giveawayDB from '../database/giveawayDB.js';
import reminderDB from '../database/reminderDB.js'; // ✅ separate DB for reminders
import { EmbedBuilder } from 'discord.js';

export function resumeAllGiveaways(client) {
  const now = Date.now();
  const active = giveawayDB.prepare('SELECT * FROM giveaways WHERE ended = 0').all();

  for (const g of active) {
    const delay = g.end_time - now;
    if (delay <= 0) {
      scheduleGiveawayEnd(client, g.id, 0); // end immediately
    } else {
      scheduleGiveawayEnd(client, g.id, delay);
    }
  }
}

export function scheduleGiveawayEnd(client, giveawayId, delay) {
  setTimeout(async () => {
    const giveaway = giveawayDB.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
    if (!giveaway || giveaway.ended) return;

    const entries = giveawayDB.prepare('SELECT user_id FROM entries WHERE giveaway_id = ?').all(giveawayId);
    const winners = entries
      .sort(() => 0.5 - Math.random())
      .slice(0, giveaway.winner_count)
      .map(e => `<@${e.user_id}>`);

    const embed = new EmbedBuilder()
      .setTitle('🎉 Giveaway Ended!')
      .setDescription(`**Prize:** ${giveaway.prize}\n**Winner(s):** ${winners.length ? winners.join(', ') : 'No one entered 😢'}`)
      .setColor('Gold')
      .setTimestamp();

    try {
      const channel = await client.channels.fetch(giveaway.channel_id);
      const message = await channel.messages.fetch(giveaway.message_id);
      await message.edit({ embeds: [embed], components: [] });
    } catch (err) {
      console.error('❌ Failed to update giveaway message:', err);
    }

    giveawayDB.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?').run(giveawayId);
  }, delay);
}

export function resumeAllReminders(client) {
  const now = Date.now();
  const reminders = reminderDB.prepare('SELECT * FROM reminders WHERE reminded = 0').all();

  for (const r of reminders) {
    const delay = r.remind_at - now;
    if (delay <= 0) {
      scheduleReminder(client, r.id, 0); // overdue, fire immediately
    } else {
      scheduleReminder(client, r.id, delay);
    }
  }
}

export function scheduleReminder(client, reminderId, delay) {
  setTimeout(async () => {
    const reminder = reminderDB.prepare('SELECT * FROM reminders WHERE id = ?').get(reminderId);
    if (!reminder || reminder.reminded) return;

    try {
      const channel = await client.channels.fetch(reminder.channel_id);
      if (!channel) return;

      await channel.send(`<@${reminder.user_id}> ⏰ Reminder: **${reminder.message}**`);

      // Mark reminder as sent
      reminderDB.prepare('UPDATE reminders SET reminded = 1 WHERE id = ?').run(reminderId);
    } catch (error) {
      console.error('❌ Failed to send reminder:', error);
    }
  }, delay);
}

