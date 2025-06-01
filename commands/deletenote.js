const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletenote')
    .setDescription('Delete a note for a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose note you want to delete')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The Discord user ID to delete note for')
        .setRequired(false)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const userId = interaction.options.getString('userid');
    if (!targetUser && !userId) {
      await interaction.reply({ content: 'Please provide either a user or a user ID.', flags: 64 });
      return;
    }
    let id, tag;
    if (targetUser) {
      id = targetUser.id;
      tag = targetUser.tag;
    } else {
      const res = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${userId}`);
      if (!res.ok) {
        await interaction.reply({ content: 'Could not find user with that ID.', flags: 64 });
        return;
      }
      const userInfo = await res.json();
      id = userId;
      tag = userInfo.tag;
    }
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`confirm-delete-${id}`).setLabel('Confirm Delete').setStyle(ButtonStyle.Danger)
    );
    await interaction.reply({ content: `Are you sure you want to delete the note for ${tag}?`, components: [row], flags: 64 });
  },
}; 