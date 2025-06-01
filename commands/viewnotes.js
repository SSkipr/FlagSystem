const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const NOTES_FILE = path.join(__dirname, '../notes.json');

const CATEGORY_EMOJIS = {
  'chill': '🧊',
  'no preference': '😐',
  'annoying': '😠',
};

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

function formatNote(note, index) {
  const emoji = CATEGORY_EMOJIS[note.category] || '';
  return `**${index + 1}.** ${emoji} *${note.category}*\n${note.note}\n*<t:${Math.floor(new Date(note.timestamp).getTime()/1000)}:R>*`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewnotes')
    .setDescription('View all notes you have made about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to view notes for')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The Discord user ID to view notes for')
        .setRequired(false)),
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const userId = interaction.options.getString('userid');
    if (!targetUser && !userId) {
      await interaction.reply({ content: '❗ Please provide either a user or a user ID.', ephemeral: true });
      return;
    }
    let id, userInfo;
    if (targetUser) {
      id = targetUser.id;
      userInfo = {
        username: targetUser.username,
        global_name: targetUser.globalName || targetUser.username,
        avatar: { link: targetUser.displayAvatarURL({ dynamic: true }) },
        badges: [],
        accent_color: null
      };
    } else {
      const res = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${userId}`);
      if (!res.ok) {
        await interaction.reply({ content: '❌ Could not find user with that ID.', ephemeral: true });
        return;
      }
      userInfo = await res.json();
      id = userId;
    }
    const notesData = loadNotes();
    const userNotes = notesData[interaction.user.id]?.notes?.filter(n => n.targetId === id) || [];
    if (userNotes.length === 0) {
      await interaction.reply({ content: `ℹ️ No notes found for **${userInfo.global_name || userInfo.username}** (${id}).`, ephemeral: true });
      return;
    }
    let page = 0;
    const notesPerPage = 3;
    const totalPages = Math.ceil(userNotes.length / notesPerPage);
    const getPageEmbed = (page) => {
      const start = page * notesPerPage;
      const end = start + notesPerPage;
      const notesSlice = userNotes.slice(start, end);
      const desc = notesSlice.map((note, i) => formatNote(note, start + i)).join('\n\n');
      const embed = new EmbedBuilder()
        .setTitle(`Notes for ${userInfo.global_name || userInfo.username}`)
        .setDescription(desc)
        .setFooter({ text: `ID: ${id} | Page ${page + 1} of ${totalPages}` });
      if (userInfo.avatar && userInfo.avatar.link) embed.setThumbnail(userInfo.avatar.link);
      if (userInfo.accent_color) embed.setColor(userInfo.accent_color);
      if (userInfo.badges && userInfo.badges.length > 0) embed.addFields({ name: 'Badges', value: userInfo.badges.join(', '), inline: false });
      return embed;
    };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev_note').setLabel('⬅️ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId('next_note').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary).setDisabled(totalPages <= 1)
    );
    await interaction.reply({ embeds: [getPageEmbed(page)], components: [row], ephemeral: true });
    const msg = await interaction.fetchReply();
    const filter = i => i.user.id === interaction.user.id && ['prev_note', 'next_note'].includes(i.customId);
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
    collector.on('collect', async i => {
      if (i.customId === 'prev_note' && page > 0) page--;
      if (i.customId === 'next_note' && page < totalPages - 1) page++;
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev_note').setLabel('⬅️ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('next_note').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1)
      );
      await i.update({ embeds: [getPageEmbed(page)], components: [newRow] });
    });
    collector.on('end', async () => {
      try {
        await msg.edit({ components: [] });
      } catch {}
    });
  },
}; 