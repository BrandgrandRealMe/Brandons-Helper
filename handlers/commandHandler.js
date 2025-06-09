import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function commandHandler(client) {
  const commandFiles = fs
    .readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(__dirname, '../commands', file);
    import(filePath).then(command => {
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`⚠️ Command at ${file} is missing "data" or "execute".`);
      }
    });
  }
}
