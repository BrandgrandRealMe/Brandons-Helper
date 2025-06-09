import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Kick a member from the server')
  .addUserOption(option => option.setName('target').setDescription('Member to kick').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for kick'))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  const member = interaction.options.getMember('target');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
  if (!member.kickable) return interaction.reply({ content: 'I cannot kick this member.', ephemeral: true });

  try {
    await member.kick(reason);
    await interaction.reply(`✅ Successfully kicked ${member.user.tag}.\nReason: ${reason}`);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Failed to kick the member.', ephemeral: true });
  }
}
