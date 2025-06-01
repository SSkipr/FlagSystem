const { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Add Note')
    .setType(ApplicationCommandType.User),
  async execute(interaction) {
    const targetUser = interaction.targetUser;

    const modal = new ModalBuilder()
      .setCustomId(`note-modal-${targetUser.id}`)
      .setTitle(`Note for ${targetUser.username}`);

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