import db from '../../database/pollDB.js';
import { EmbedBuilder } from 'discord.js';

export async function handleVote(interaction) {
  if (!interaction.isButton()) return;

  try {
    const customId = interaction.customId; // e.g. "vote_<pollId>_<optionIndex>"

    const parts = customId.split('_');
    if (parts.length !== 3) {
      return interaction.reply({ content: 'Invalid vote button ID.', flags: 64 });
    }

    const pollId = parts[1];
    const optionIndex = parseInt(parts[2], 10);

    // Check poll exists
    const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId);
    if (!poll) {
      return interaction.reply({ content: 'Poll not found or ended.', flags: 64 });
    }

    const options = JSON.parse(poll.options);
    if (optionIndex < 0 || optionIndex >= options.length) {
      return interaction.reply({ content: 'Invalid poll option.', flags: 64 });
    }

    // Insert or update vote
    const existingVote = db.prepare('SELECT * FROM poll_votes WHERE poll_id = ? AND user_id = ?').get(pollId, interaction.user.id);
    if (existingVote) {
      db.prepare('UPDATE poll_votes SET option_index = ? WHERE poll_id = ? AND user_id = ?').run(optionIndex, pollId, interaction.user.id);
    } else {
      db.prepare('INSERT INTO poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)').run(pollId, interaction.user.id, optionIndex);
    }

    await interaction.reply({ content: `Your vote for **${options[optionIndex]}** has been recorded!`, flags: 64 });

    // Get current vote counts
    const votes = db.prepare('SELECT option_index, COUNT(*) as count FROM poll_votes WHERE poll_id = ? GROUP BY option_index').all(pollId);

    const resultsText = options.map((opt, i) => {
      const voteCount = votes.find(v => v.option_index === i)?.count || 0;
      return `${opt}: **${voteCount}** vote(s)`;
    }).join('\n');

    // Fetch original poll message
    const channel = await interaction.client.channels.fetch(poll.channel_id);
    const message = await channel.messages.fetch(poll.message_id);

    // Build updated embed - title is the poll question, description is results only
    const updatedEmbed = new EmbedBuilder()
      .setTitle(poll.question)
      .setDescription(resultsText)
      .setColor('Blue')
      .setTimestamp(new Date());

    // Optionally keep footer/icon from original if needed here

    await message.edit({ embeds: [updatedEmbed] });

  } catch (err) {
    console.error('Error handling vote:', err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'An error occurred while processing your vote.', flags: 64 });
    }
  }
}
