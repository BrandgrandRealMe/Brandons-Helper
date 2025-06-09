import { Client, GatewayIntentBits, Events } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import './cron-fetch.js';
import { fetchDocsFromSitemap } from './fetchDocs.js';
import settings from './config/settings.js'; 
import './deploy-commands.js';

let docs = '';
(async () => {
  await fetchDocsFromSitemap();
  try {
    docs = fs.readFileSync('./docs.txt', 'utf-8');
  } catch (error) {
    console.error('🚨 Error reading docs.txt:', error.message);
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
      settings.DOCS_MAX_CHAR_LENGTH
    )}\n\nQuestion: ${question}`;

    const res = await fetch(settings.AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.AI_TOKEN}`,
      },
      body: JSON.stringify({
        model: settings.AI_MODEL,
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

    if (!res.ok) {
      const errorText = await res.text();
      const errorMessageToUser = `⚠️ AI service returned an error (${res.status}). An administrator has been notified.`;
      console.error(
        `AI API Non-OK response (Status: ${res.status}):`,
        errorText
      );
      await interaction.editReply(errorMessageToUser);

      if (settings.ERROR_LOG_CHANNEL_ID) {
        const errorChannel = await client.channels.fetch(
          settings.ERROR_LOG_CHANNEL_ID
        );
        if (errorChannel && errorChannel.isTextBased()) {
          const errorLogMessage = `🚨 AI API Error Report 🚨
            **User:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)
            **Command:** \`/${interaction.commandName}\`
            **Question:** \`${question}\`
            **API Status:** \`${res.status}\`
            **API Response Body:** \`\`\`json\n${errorText.slice(0, 1500)}\n\`\`\`
            **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`;
          await errorChannel.send(errorLogMessage);
        } else {
          console.error(
            '⚠️ ERROR_LOG_CHANNEL_ID is set but invalid or not a text channel.'
          );
        }
      } else {
        console.warn('⚠️ ERROR_LOG_CHANNEL_ID is not set in .env or settings.js.');
      }
      return; // Stop execution if API response is not OK
    }

    const data = await res.json();

    let answer = data.reply?.trim(); // Get the reply, might be undefined

    // Check if 'data' has an 'error' field AND 'reply' is not present or empty
    if (data.error && (!answer || answer === '')) {
      const apiError = typeof data.error === 'object' ? JSON.stringify(data.error) : data.error;
      const errorMessageToUser = `❌ There was an error processing your request: \`${apiError}\`. An administrator has been notified.`;
      console.error('AI Response Contains Error:', apiError);
      await interaction.editReply(errorMessageToUser);

      // Send the full error details to the error log channel
      if (settings.ERROR_LOG_CHANNEL_ID) {
        const errorChannel = await client.channels.fetch(
          settings.ERROR_LOG_CHANNEL_ID
        );
        if (errorChannel && errorChannel.isTextBased()) {
          const errorLogMessage = `🚨 AI Model Error Report 🚨
            **User:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)
            **Command:** \`/${interaction.commandName}\`
            **Question:** \`${question}\`
            **AI Model Error:** \`\`\`json\n${apiError.slice(0, 1500)}\n\`\`\`
            **Full AI Response:** \`\`\`json\n${JSON.stringify(data).slice(0, 1500)}\n\`\`\`
            **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`;
          await errorChannel.send(errorLogMessage);
        } else {
          console.error(
            '⚠️ ERROR_LOG_CHANNEL_ID is set but invalid or not a text channel.'
          );
        }
      } else {
        console.warn('⚠️ ERROR_LOG_CHANNEL_ID is not set in .env or settings.js.');
      }
      return; // Stop execution if AI response explicitly contains an error
    }

    // If no error and reply exists, proceed with the answer
    if (answer) {
      if (answer.length > 2000) answer = answer.slice(0, 1997) + '...';
      await interaction.editReply(answer);
    } else {
      // Fallback if no reply and no explicit error (e.g., unexpected empty response)
      console.warn('AI returned no "reply" field and no "error" field.');
      await interaction.editReply('❌ The AI did not provide a usable response.');
    }
  } catch (err) {
    // Catch-all for unexpected network errors or other code issues
    console.error('❌ Uncaught Error during interaction:', err);
    await interaction.editReply('⚠️ An unexpected error occurred. An administrator has been notified.');

    // Send uncaught errors to the error log channel as well
    if (settings.ERROR_LOG_CHANNEL_ID) {
        const errorChannel = await client.channels.fetch(
            settings.ERROR_LOG_CHANNEL_ID
        );
        if (errorChannel && errorChannel.isTextBased()) {
            const errorLogMessage = `🚨 Uncaught Bot Error Report 🚨
            **User:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)
            **Command:** \`/${interaction.commandName}\`
            **Question:** \`${question}\`
            **Error:** \`\`\`\n${err.stack?.slice(0, 1500) || err.message}\n\`\`\`
            **Timestamp:** <t:${Math.floor(Date.now() / 1000)}:F>`;
            await errorChannel.send(errorLogMessage);
        }
    }
  }
});

client.login(settings.DISCORD_TOKEN);