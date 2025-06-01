const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a note and categorize a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to note/categorize')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The Discord user ID to note/categorize')
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
    const modal = new ModalBuilder()
      .setCustomId(`note-modal-${id}`)
      .setTitle(`Note for ${tag}`);
    const noteInput = new TextInputBuilder()
      .setCustomId('note-input')
      .setLabel('Add a note about this user')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);
    const firstRow = new ActionRowBuilder().addComponents(noteInput);
    modal.addComponents(firstRow);
    await interaction.showModal(modal);
  },
}; 