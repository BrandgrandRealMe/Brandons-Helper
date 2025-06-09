import { Client, GatewayIntentBits, Events } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import 'dotenv/config';
import './cron-fetch.js';
import { fetchDocsFromSitemap } from './fetchDocs.js';
import './deploy-commands.js'; // Import deploy-commands.js

let docs = '';
(async () => {
  await fetchDocsFromSitemap();
  try {
    docs = fs.readFileSync('./docs.txt', 'utf-8');
  } catch {
    docs = 'Docs not loaded.';
  }
})();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'ask') return;

  const question = interaction.options.getString('question');
  await interaction.deferReply();

  try {
    const prompt = `Use only the documentation below to answer:\n\n${docs.slice(
      0,
      8000
    )}\n\nQuestion: ${question}`;
    const res = await fetch(process.env.AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_TOKEN}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You answer questions strictly based on provided documentation. Link to page if possible. If the answer is not in the docs, reply with "Not in docs. But I can help!" then a new line with the answer!',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await res.json();
    console.log(data)
    let answer = data.reply?.trim() || '❌ No response.';
    if (answer.length > 2000) answer = answer.slice(0, 1997) + '...';

    await interaction.editReply(answer);
  } catch (err) {
    console.error('❌ Error:', err);
    await interaction.editReply('⚠️ Failed to fetch answer.');
  }
});

client.login(process.env.DISCORD_TOKEN);