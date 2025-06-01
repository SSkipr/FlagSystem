const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
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

function formatNote(note, index, userId) {
  const emoji = CATEGORY_EMOJIS[note.category] || '';
  return `**${index + 1}.** ${emoji} *${note.category}*\n${note.note}\n*<t:${Math.floor(new Date(note.timestamp).getTime()/1000)}:R>*\nUser: <@${note.targetId}> (${note.targetId})`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('allnotes')
    .setDescription('Print all notes you have made, for all users'),
  async execute(interaction) {
    const notesData = loadNotes();
    const userNotes = notesData[interaction.user.id]?.notes || [];
    if (userNotes.length === 0) {
      await interaction.reply({ content: `ℹ️ You have not made any notes yet.`, ephemeral: true });
      return;
    }
    let page = 0;
    const notesPerPage = 3;
    const totalPages = Math.ceil(userNotes.length / notesPerPage);
    async function getUserInfo(id) {
      try {
        const res = await fetch(`https://discordlookup.mesalytic.moe/v1/user/${id}`);
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    }
    const getPageEmbed = async (page) => {
      const start = page * notesPerPage;
      const end = start + notesPerPage;
      const notesSlice = userNotes.slice(start, end);
      let desc = '';
      let userInfos = await Promise.all(notesSlice.map(n => getUserInfo(n.targetId)));
      desc = notesSlice.map((note, i) => {
        const userInfo = userInfos[i];
        let userLine = userInfo ? `**${userInfo.global_name || userInfo.username}** (${note.targetId})` : `<@${note.targetId}> (${note.targetId})`;
        let badgeLine = userInfo && userInfo.badges && userInfo.badges.length > 0 ? `\nBadges: ${userInfo.badges.join(', ')}` : '';
        return `${userLine}${badgeLine}\n${formatNote(note, start + i, interaction.user.id)}`;
      }).join('\n\n');
      const embed = new EmbedBuilder()
        .setTitle('All Your Notes')
        .setDescription(desc)
        .setFooter({ text: `Page ${page + 1} of ${totalPages}` });
      // Optionally set thumbnail or color for the first user on the page
      if (userInfos[0] && userInfos[0].avatar && userInfos[0].avatar.link) embed.setThumbnail(userInfos[0].avatar.link);
      if (userInfos[0] && userInfos[0].accent_color) embed.setColor(userInfos[0].accent_color);
      return embed;
    };
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('prev_allnotes').setLabel('⬅️ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
      new ButtonBuilder().setCustomId('next_allnotes').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary).setDisabled(totalPages <= 1)
    );
    await interaction.reply({ embeds: [await getPageEmbed(page)], components: [row], ephemeral: true });
    const msg = await interaction.fetchReply();
    const filter = i => i.user.id === interaction.user.id && ['prev_allnotes', 'next_allnotes'].includes(i.customId);
    const collector = msg.createMessageComponentCollector({ filter, time: 60000 });
    collector.on('collect', async i => {
      if (i.customId === 'prev_allnotes' && page > 0) page--;
      if (i.customId === 'next_allnotes' && page < totalPages - 1) page++;
      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev_allnotes').setLabel('⬅️ Prev').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder().setCustomId('next_allnotes').setLabel('Next ➡️').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1)
      );
      await i.update({ embeds: [await getPageEmbed(page)], components: [newRow] });
    });
    collector.on('end', async () => {
      try {
        await msg.edit({ components: [] });
      } catch {}
    });
  },
}; 