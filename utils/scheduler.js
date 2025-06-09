import db from '../database/giveawayDB.js';
import { EmbedBuilder } from 'discord.js';

export function resumeAllGiveaways(client) {
  const now = Date.now();
  const active = db.prepare('SELECT * FROM giveaways WHERE ended = 0').all();

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
    const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
    if (!giveaway || giveaway.ended) return;

    const entries = db.prepare('SELECT user_id FROM entries WHERE giveaway_id = ?').all(giveawayId);
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

    db.prepare('UPDATE giveaways SET ended = 1 WHERE id = ?').run(giveawayId);
  }, delay);
}
