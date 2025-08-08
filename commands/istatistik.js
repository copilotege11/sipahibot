const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../ticketStatsDB');

let statsIntervals = {}; // { userId: intervalId }

function getClaimStats(callback) {
  db.all("SELECT * FROM claim_stats ORDER BY claim_count DESC", [], (err, rows) => {
    if (err) return callback([]);
    callback(rows);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('istatistik')
    .setDescription('Yetkili ticket claim istatistiklerini gösterir'),
  async execute(interaction) {
    // SADECE SEN KULLANABİLİRSİN
    if (interaction.user.id !== '823299501556236359') { // Kendi Discord kullanıcı ID'ni buraya yaz!
      return await interaction.reply({
        content: '❌ Bu komutu sadece bot sahibi kullanabilir.',
        ephemeral: true,
      });
    }

    // Aynı kullanıcı yeniden kullanırsa eski intervali temizle
    if (statsIntervals[interaction.user.id]) {
      clearInterval(statsIntervals[interaction.user.id]);
      delete statsIntervals[interaction.user.id];
    }

    function buildStatsEmbed(rows) {
      let desc = rows.length
        ? rows.map((r, i) => `${i + 1}. <@${r.user_id}> — **${r.claim_count}** ticket`).join('\n')
        : "Hiç istatistik yok.";
      return new EmbedBuilder()
        .setTitle("Yetkili Ticket İstatistikleri")
        .setDescription(desc)
        .setColor('Green')
        .setTimestamp();
    }

    getClaimStats(async (rows) => {
      const embed = buildStatsEmbed(rows);
      const statsMsg = await interaction.reply({ embeds: [embed], fetchReply: true });

      statsIntervals[interaction.user.id] = setInterval(() => {
        getClaimStats(async (updatedRows) => {
          try {
            await statsMsg.edit({ embeds: [buildStatsEmbed(updatedRows)] });
          } catch (err) {
            clearInterval(statsIntervals[interaction.user.id]);
            delete statsIntervals[interaction.user.id];
          }
        });
      }, 10000);
    });
  }
};