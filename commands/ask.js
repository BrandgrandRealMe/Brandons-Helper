import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask a question based on the docs')
  .addStringOption(option =>
    option.setName('question').setDescription('Your question').setRequired(true)
  );

export async function execute(interaction, { docs, client, settings }) {
  const question = interaction.options.getString('question');
  await interaction.deferReply();

  const prompt = `Use only the documentation below to answer:\n\n${docs.slice(
    0,
    settings.DOCS_MAX_CHAR_LENGTH
  )}\n\nQuestion: ${question}`;

  try {
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
    await interaction.editReply(answer || '❌ No response from the AI.');
  } catch (err) {
    console.error('❌ Ask command error:', err);
    await interaction.editReply('Unexpected error occurred.');
  }
}
