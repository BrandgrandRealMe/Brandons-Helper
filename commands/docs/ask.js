import { SlashCommandBuilder } from 'discord.js';

const cooldown = new Map(); // userId => timestamp
const COOLDOWN_SECONDS = 5;

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask a question based on the docs')
  .addStringOption(option =>
    option.setName('question').setDescription('Your question').setRequired(true)
  );

// Helper to chunk docs
function chunkText(text, maxLength = 4000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }
  return chunks;
}

export async function execute(interaction, { docs, client, settings }) {
  const userId = interaction.user.id;
  const now = Date.now();

  // Cooldown check
  const lastUsed = cooldown.get(userId);
  if (lastUsed && now - lastUsed < COOLDOWN_SECONDS * 1000) {
    const remaining = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - lastUsed)) / 1000);
    return interaction.reply({
      content: `⏳ Please wait ${remaining}s before using this command again.`,
      ephemeral: true,
    });
  }

  cooldown.set(userId, now);

  const question = interaction.options.getString('question');
  await interaction.deferReply();

  const docChunks = chunkText(docs, settings.DOCS_MAX_CHAR_LENGTH || 4000);

  const messages = [
    {
      role: 'system',
      content:
        'You answer questions strictly based on provided documentation. Format your response for Discord and Link to pages if possible. Example [Page Title](URL). If the answer is not in the docs, reply with "Not in docs. But I can help!" then a new line with the best answer!',
    },
    ...docChunks.map((chunk, i) => ({
      role: 'system',
      content: `Documentation Part ${i + 1}:\n${chunk}`,
    })),
    {
      role: 'user',
      content: `Question: ${question}`,
    },
  ];

  let pasteUrl = null;

  // 🧪 Upload prompt if devMode is on
  if (settings.devMode) {
    try {
      const pasteRes = await fetch('https://api.pastes.dev/post', {
        method: 'POST',
        body: JSON.stringify({
          content: messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join('\n\n'),
          language: 'text',
        }),
      });

      const pasteData = await pasteRes.json();
      console.log(pasteData);
      if (pasteRes.ok && pasteData?.key) {
        pasteUrl = `https://pastes.dev/${pasteData.key}`;
      }
    } catch (err) {
      console.warn('⚠️ Failed to upload prompt to pastes.dev:', err);
    }
  }

  try {
    const res = await fetch(settings.AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.AI_TOKEN}`,
      },
      body: JSON.stringify({
        model: settings.AI_MODEL,
        messages,
      }),
    });

    const data = await res.json();
    let answer = data.reply?.trim();

    if (!res.ok || (data.error && !answer)) {
      const errorMsg = data.error ? JSON.stringify(data.error) : await res.text();
      await interaction.editReply(`⚠️ API error: \`${errorMsg.slice(0, 1000)}\``);

      if (settings.ERROR_LOG_CHANNEL_ID) {
        const errorChannel = await client.channels.fetch(settings.ERROR_LOG_CHANNEL_ID);
        if (errorChannel?.isTextBased()) {
          await errorChannel.send(`❗ Error in /ask: \`${question}\`\n\`\`\`json\n${errorMsg}\n\`\`\``);
        }
      }
      return;
    }

    if (answer?.length > 2000) answer = answer.slice(0, 1997) + '...';

    const replyText = `${answer || '❌ No response from the AI.'}${
      pasteUrl ? `\n\n📎 Prompt: ${pasteUrl}` : ''
    }`;

    await interaction.editReply(replyText);
  } catch (err) {
    console.error('❌ Ask command error:', err);
    await interaction.editReply('Unexpected error occurred.');
  }
}