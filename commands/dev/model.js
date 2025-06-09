import { SlashCommandBuilder } from 'discord.js';
import settings from '../../config/settings.js';

export const data = new SlashCommandBuilder()
  .setName('model')
  .setDescription('[DEV ONLY] Get or change the AI model')
  .addSubcommand(sub =>
    sub
      .setName('get')
      .setDescription('Get the current AI model')
  )
  .addSubcommand(sub =>
    sub
      .setName('change')
      .setDescription('Change the AI model')
      .addStringOption(option =>
        option
          .setName('model')
          .setDescription('The new model to use')
          .setRequired(true)
      )
  );

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'get') {
    return interaction.reply({
      content: `🤖 Current model: \`${settings.AI_MODEL}\``,
      ephemeral: true
    });
  }

  if (subcommand === 'change') {
    // Only allow the developer to change the model
    if (interaction.user.id !== settings.DEV_ID) {
      return interaction.reply({
        content: '❌ This command is restricted to the bot developer only.',
        ephemeral: true
      });
    }

    const newModel = interaction.options.getString('model');
    settings.AI_MODEL = newModel;

    return interaction.reply({
      content: `✅ AI model changed to: \`${newModel}\``,
      ephemeral: true
    });
  }
}