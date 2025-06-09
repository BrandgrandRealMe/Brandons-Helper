import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import settings from './config/settings.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commands = [];

async function loadCommandsRecursively(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await loadCommandsRecursively(fullPath);
    } else if (file.name.endsWith('.js')) {
      const command = await import(fullPath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(`⚠️ The command at ${fullPath} is missing "data" or "execute"`);
      }
    }
  }
}

await loadCommandsRecursively(path.join(__dirname, './commands'));

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