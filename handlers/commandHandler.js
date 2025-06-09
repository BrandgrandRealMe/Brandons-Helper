import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadCommandsRecursively(dir, client) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await loadCommandsRecursively(fullPath, client);
    } else if (file.name.endsWith('.js')) {
      const command = await import(fullPath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
      } else {
        console.warn(`⚠️ Command at ${fullPath} is missing "data" or "execute".`);
      }
    }
  }
}

export default async function commandHandler(client) {
  await loadCommandsRecursively(path.join(__dirname, '../commands'), client);
}