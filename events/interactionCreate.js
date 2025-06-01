const fs = require('fs');
const path = require('path');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const NOTES_FILE = path.join(__dirname, '../notes.json');

function loadNotes() {
  if (!fs.existsSync(NOTES_FILE)) return {};
  try {
    const data = fs.readFileSync(NOTES_FILE, 'utf8');
    if (!data.trim()) return {};
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

const allowedCategories = ['chill', 'no preference', 'annoying'];

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isChatInputCommand() || interaction.isUserContextMenuCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (command) {
        await command.execute(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      const userId = interaction.user.id;
      const targetId = interaction.customId.split('-')[2];
      const note = interaction.fields.getTextInputValue('note-input');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`cat-chill-${targetId}`).setLabel('Chill').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`cat-no_preference-${targetId}`).setLabel('No Preference').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`cat-annoying-${targetId}`).setLabel('Annoying').setStyle(ButtonStyle.Danger)
      );
      if (!global._pendingNotes) global._pendingNotes = {};
      global._pendingNotes[`${userId}_${targetId}`] = note;
      await interaction.reply({ content: 'Select a category for this note:', components: [row], flags: 64 });
    } else if (interaction.isButton()) {
      const userId = interaction.user.id;
      const [prefix, category, targetId] = interaction.customId.split('-');
      if (prefix === 'cat' && allowedCategories.includes(category.replace('_', ' '))) {
        const note = global._pendingNotes?.[`${userId}_${targetId}`];
        if (!note) {
          await interaction.reply({ content: 'No pending note found. Please try again.', flags: 64 });
          return;
        }
        const timestamp = new Date().toISOString();
        let notes = loadNotes();
        if (!notes[userId]) notes[userId] = { userId, notes: [] };
        notes[userId].notes = notes[userId].notes.filter(n => n.targetId !== targetId);
        notes[userId].notes.push({ targetId, note, category: category.replace('_', ' '), timestamp });
        saveNotes(notes);
        delete global._pendingNotes[`${userId}_${targetId}`];
        await interaction.reply({ content: `Note saved for <@${targetId}>!`, flags: 64 });
      } else if (prefix === 'confirm' && category === 'delete') {
        let notes = loadNotes();
        if (!notes[userId]) notes[userId] = { userId, notes: [] };
        const before = notes[userId].notes.length;
        notes[userId].notes = notes[userId].notes.filter(n => n.targetId !== targetId);
        saveNotes(notes);
        const after = notes[userId].notes.length;
        if (before === after) {
          await interaction.reply({ content: `ℹ️ No note found to delete for <@${targetId}>.`, flags: 64 });
        } else {
          await interaction.reply({ content: `🗑️ Note deleted for <@${targetId}>!`, flags: 64 });
        }
      }
    }
  },
}; 