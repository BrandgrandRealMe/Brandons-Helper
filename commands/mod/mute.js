import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mute')
  .setDescription('Timeout (mute) a member for a specified duration')
  .addUserOption(option => option.setName('target').setDescription('Member to mute').setRequired(true))
  .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for mute'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const member = interaction.options.getMember('target');
  const duration = interaction.options.getInteger('duration');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
  if (!member.moderatable) return interaction.reply({ content: 'I cannot timeout this member.', ephemeral: true });

  try {
    const timeoutMs = duration * 60 * 1000; // minutes to ms
    await member.timeout(timeoutMs, reason);
    await interaction.reply(`✅ ${member.user.tag} has been muted for ${duration} minute(s).\nReason: ${reason}`);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Failed to mute the member.', ephemeral: true });
  }
}
