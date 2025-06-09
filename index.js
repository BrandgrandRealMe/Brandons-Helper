import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import fs from 'fs';
import fetch from 'node-fetch';
import { resumeAllGiveaways, resumeAllReminders } from './utils/scheduler.js';
import db from './database/giveawayDB.js';
import { handleButton } from './handlers/buttonHandler.js';

import settings from './config/settings.js';
import './cron-fetch.js';

import { fetchDocsFromSitemap } from './fetchDocs.js';
import './deploy-commands.js';
import commandHandler from './handlers/commandHandler.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

let docs = '';
(async () => {
  await fetchDocsFromSitemap();
  try {
    docs = fs.readFileSync('./docs.txt', 'utf-8');
  } catch (err) {
    console.error('🚨 Failed to read docs.txt:', err.message);
    docs = 'Docs not loaded.';
  }
})();

// Load all commands
commandHandler(client);

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    await handleButton(interaction);
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, { docs, client, settings });
  } catch (error) {
    console.error(`❌ Error executing /${interaction.commandName}:`, error);
    await interaction.reply({
      content: '❌ There was an error while executing this command.',
      ephemeral: true,
    });
  }
});

client.login(settings.DISCORD_TOKEN);

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
  resumeAllGiveaways(client);
  resumeAllReminders(client);
});

// Handle entry button
client.on(Events.InteractionCreate, async i => {
  if (!i.isButton()) return;

  const match = i.customId.match(/^enter_(.+)$/);
  if (!match) return;

  const giveawayId = match[1];
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ? AND ended = 0').get(giveawayId);
  if (!giveaway) {
    return i.reply({ content: '❌ This giveaway has ended or does not exist.', ephemeral: true });
  }

  try {
    db.prepare('INSERT INTO entries (giveaway_id, user_id) VALUES (?, ?)').run(giveawayId, i.user.id);
    await i.reply({ content: '✅ You have entered the giveaway!', ephemeral: true });
  } catch {
    await i.reply({ content: '❌ You have already entered.', ephemeral: true });
  }
});
