import { handleVote } from './buttons/voteHandler.js';

export async function handleButton(interaction) {
  if (!interaction.isButton()) return;
  console.log('Button pressed:', interaction.customId);

  // Route by customId prefix
  if (interaction.customId.startsWith('pollvote_')) {
    await handleVote(interaction);
  } 
  // Add other button handlers here:
  // else if (interaction.customId.startsWith('someOtherPrefix_')) {
  //   await handleOther(interaction);
  // }
  else {
    await interaction.reply({ content: 'Unknown button interaction.', ephemeral: true });
  }
}
