import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Ban a member from the server')
  .addUserOption(option => option.setName('target').setDescription('Member to ban').setRequired(true))
  .addStringOption(option => option.setName('reason').setDescription('Reason for ban'))
  .addIntegerOption(option => option.setName('days').setDescription('Days of messages to delete').setMinValue(0).setMaxValue(7))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  const member = interaction.options.getMember('target');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const days = interaction.options.getInteger('days') || 0;

  if (!member) return interaction.reply({ content: 'User not found.', ephemeral: true });
  if (!member.bannable) return interaction.reply({ content: 'I cannot ban this member.', ephemeral: true });

  try {
    await member.ban({ days, reason });
    await interaction.reply(`✅ Successfully banned ${member.user.tag}.\nReason: ${reason}\nDeleted Messages: ${days} days`);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Failed to ban the member.', ephemeral: true });
  }
}
