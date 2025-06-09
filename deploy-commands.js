// deploy-commands.js
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import settings from './config/settings.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [];

const commandFiles = fs
  .readdirSync(path.join(__dirname, './commands'))
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ The command at ${file} is missing "data" or "execute"`);
  }
}

const rest = new REST({ version: '10' }).setToken(settings.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(settings.CLIENT_ID, settings.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Successfully registered all slash commands.');
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
})();
