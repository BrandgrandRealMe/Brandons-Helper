// deploy-commands.js
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import 'dotenv/config'; // Make sure this is at the top for environment variables

const commands = [
  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask a question about the docs')
    .addStringOption(opt =>
      opt.setName('question').setDescription('Your question').setRequired(true)
    ),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Wrap the deployment logic in an async IIFE
(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Successfully reloaded application (/) commands.');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
})();