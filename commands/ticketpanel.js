const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');

// Sadece senin kullanabilmen için ID kontrolü
const OWNER_ID = '823299501556236359';

let panelInterval = null;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticketpanel')
    .setDescription('Ticket panelini gönderir'),

  async execute(interaction) {
    // Sadece OWNER_ID kullanabilsin!
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ Bu komutu sadece bot sahibi kullanabilir.',
        ephemeral: true
      });
    }

    // Eski intervali temizle
    if (panelInterval) clearInterval(panelInterval);

    // Panel embed ve select menu
    const embed = new EmbedBuilder()
      .setTitle('Sipahi Destek Sistemi')
      .setDescription('Destek ticketı oluşturmak için aşağıdan ilgili alanı seçiniz.')
      .setColor(0x2F3136)
      .setAuthor({ name: '[TR] Sipahi Game Community', iconURL: `attachment://sipahilogo.png` });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Lütfen destek türünü seçiniz...')
      .addOptions([
        {
          label: 'Genel Destek',
          description: 'Genel sorular ve destek için.',
          emoji: '📩',
          value: 'genel_destek',
        },
        {
          label: 'Ban İtiraz',
          description: 'Ban itiraz talebi oluştur.',
          emoji: '⛔',
          value: 'ban_itiraz',
        },
        {
          label: 'Yetkili Şikayet',
          description: 'Yetkili hakkında şikayet bildir.',
          emoji: '📩',
          value: 'yetkili_sikayet',
        },
        {
          label: 'Yetkili Başvuru',
          description: 'Yetkili olmak için başvuru yap.',
          emoji: '📝',
          value: 'yetkili_basvuru',
        },
        {
          label: 'Whitelist Başvuru',
          description: 'Whitelist başvurusu oluştur.',
          emoji: '🔖',
          value: 'whitelist_basvuru',
        },
        {
          label: 'Oyuncu Şikayet',
          description: 'Bir oyuncuyu şikayet etmek için.',
          emoji: '⚠️',
          value: 'oyuncu_sikayet',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // Paneli gönder
    const sentMsg = await interaction.reply({
      embeds: [embed],
      components: [row],
      files: [{ attachment: path.join(__dirname, 'sipahilogo.png'), name: 'sipahilogo.png' }],
      fetchReply: true
    });

    // 5 saniyede bir paneli otomatik edit et
    panelInterval = setInterval(async () => {
      try {
        await sentMsg.edit({
          embeds: [embed],
          components: [row],
          files: [{ attachment: path.join(__dirname, 'sipahilogo.png'), name: 'sipahilogo.png' }]
        });
      } catch (err) {
        clearInterval(panelInterval);
        panelInterval = null;
        console.error("Panel otomatik edit hatası:", err);
      }
    }, 10000); // 10 saniye
  },
};