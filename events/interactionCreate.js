const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

// Veritabanı bağlantısı
const db = require('../ticketStatsDB');

// Her ticket türüne özel birden fazla destek ekibi rol ID'si (örnek ID'ler, kendinize göre değiştirin!)
const destekEkibiRolIDs = {
  genel_destek: ["1393953341666623619", "1393949955751673926"],
  oyuncu_sikayet: ["1393949765393449114", "1393949816328814693", "1393949857655554142", "1393949816328814693", "1393949955751673926"],
  ban_itiraz: ["1393949816328814693", "1393949765393449114", "1393949816328814693", "1393949857655554142", "1393949816328814693", "1393949955751673926"], 
  yetkili_basvuru: ["1393949857655554142", "1393949955751673926"],
  yetkili_sikayet: ["1393949816328814693", "1393949857655554142", "1393949955751673926"],
  whitelist_basvuru: ["1399451875945877574", "1393949955751673926"],
};

const categoryIds = {
  genel_destek: "1393963386752077894",
  ban_itiraz: "1393963422294474813",
  yetkili_sikayet: "1393963462916444291",
  yetkili_basvuru: "1393963510010220606",
  whitelist_basvuru: "1399453070374731828",
  oyuncu_sikayet: "1402798249386971217",
};

const transcriptChannelId = "1402798801017896971"; // transcriptlerin gönderileceği kanalın ID'si

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {

    function userHasOpenTicket(guild, username) {
      const channelName = `ticket-${username}`;
      return guild.channels.cache.find(c =>
        (c.name === channelName) ||
        (c.name === channelName.toLowerCase())
      );
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: '❌ Komut çalıştırılırken hata oluştu.',
          ephemeral: true,
        });
      }
    }

    // PANELDEN SEÇİM YAPILDIĞINDA
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ticket_select') {
        const selectedValue = interaction.values[0];
        const destekEkibiRolIDList = (destekEkibiRolIDs[selectedValue] || []).filter(Boolean);

        if (userHasOpenTicket(interaction.guild, interaction.user.username)) {
          return interaction.reply({
            content: `❗ Zaten bir açık ticket'in var. Önce mevcut ticket'ını kapatmalısın.`,
            ephemeral: true,
          });
        }

        // GENEL DESTEK
        if (selectedValue === 'genel_destek') {
          const modal = new ModalBuilder()
            .setCustomId('genel_destek_modal')
            .setTitle('Genel Destek Talebi');

          const nedenInput = new TextInputBuilder()
            .setCustomId('ticket_reason')
            .setLabel('Destek talebinizin sebebi')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(nedenInput));
          return await interaction.showModal(modal);
        }

        // OYUNCU ŞİKAYET
        if (selectedValue === 'oyuncu_sikayet') {
          const modal = new ModalBuilder()
            .setCustomId('oyuncu_sikayet_modal')
            .setTitle('Oyuncu Şikayet');

          const kisiInput = new TextInputBuilder()
            .setCustomId('kisi_ismi')
            .setLabel('Şikayet Edilen Kişi')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const olayInput = new TextInputBuilder()
            .setCustomId('olay_anlatimi')
            .setLabel('Olayın Açıklaması')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(kisiInput),
            new ActionRowBuilder().addComponents(olayInput)
          );

          return await interaction.showModal(modal);
        }

        // YETKİLİ ŞİKAYET
        if (selectedValue === 'yetkili_sikayet') {
          const modal = new ModalBuilder()
            .setCustomId('yetkili_sikayet_modal')
            .setTitle('Yetkili Şikayet');

          const yetkiliInput = new TextInputBuilder()
            .setCustomId('yetkili_ismi')
            .setLabel('Şikayet Edilen Yetkili')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const olayInput = new TextInputBuilder()
            .setCustomId('olay_anlatimi')
            .setLabel('Olayın Açıklaması')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(yetkiliInput),
            new ActionRowBuilder().addComponents(olayInput)
          );

          return await interaction.showModal(modal);
        }

        // BAN İTİRAZ
        if (selectedValue === 'ban_itiraz') {
          const modal = new ModalBuilder()
            .setCustomId('ban_itiraz_modal')
            .setTitle('Ban İtirazı');

          const adInput = new TextInputBuilder()
            .setCustomId('adiniz')
            .setLabel('Adınız')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const steamIdInput = new TextInputBuilder()
            .setCustomId('steam64id')
            .setLabel('Steam64 ID')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(adInput),
            new ActionRowBuilder().addComponents(steamIdInput)
          );

          return await interaction.showModal(modal);
        }

        // YETKİLİ BAŞVURU
        if (selectedValue === 'yetkili_basvuru') {
          const modal = new ModalBuilder()
            .setCustomId('yetkili_basvuru_modal')
            .setTitle('Yetkili Başvuru Formu');

          const adYasInput = new TextInputBuilder()
            .setCustomId('ad_yas')
            .setLabel('Adınız ve Yaşınız')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const deneyimInput = new TextInputBuilder()
            .setCustomId('deneyim')
            .setLabel('Daha önce yetkili oldunuz mu?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const nedenInput = new TextInputBuilder()
            .setCustomId('neden')
            .setLabel('Neden yetkili olmak istiyorsunuz?')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          const klanInput = new TextInputBuilder()
            .setCustomId('klanlar')
            .setLabel('Geçmiş ve şu anki klanınız (varsa)')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

          const aktiflikInput = new TextInputBuilder()
            .setCustomId('aktiflik')
            .setLabel('Günlük aktiflik süreniz (saat)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(adYasInput),
            new ActionRowBuilder().addComponents(deneyimInput),
            new ActionRowBuilder().addComponents(nedenInput),
            new ActionRowBuilder().addComponents(klanInput),
            new ActionRowBuilder().addComponents(aktiflikInput),
          );

          return await interaction.showModal(modal);
        }

        // WHITELIST BAŞVURU
        if (selectedValue === 'whitelist_basvuru') {
          const modal = new ModalBuilder()
            .setCustomId('whitelist_basvuru_modal')
            .setTitle('Whitelist Başvurusu');

          const typeInput = new TextInputBuilder()
            .setCustomId('whitelist_tipi')
            .setLabel('Klan/Veteran seçiniz')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(typeInput));
          return await interaction.showModal(modal);
        }
      }
    }

    // MODAL SUBMITLERİ
    if (interaction.isModalSubmit()) {
      let destekEkibiRolIDList = [];
      let categoryId = null;
      let channelName = `ticket-${interaction.user.username}`;
      let ticketTypeForTopic = "";

      // Açık ticket kontrolü
      if (
        interaction.customId === 'genel_destek_modal' ||
        interaction.customId === 'oyuncu_sikayet_modal' ||
        interaction.customId === 'yetkili_sikayet_modal' ||
        interaction.customId === 'ban_itiraz_modal' ||
        interaction.customId === 'yetkili_basvuru_modal' ||
        interaction.customId === 'whitelist_basvuru_modal'
      ) {
        if (userHasOpenTicket(interaction.guild, interaction.user.username)) {
          return interaction.reply({
            content: `❗ Zaten bir açık ticket'in var. Önce mevcut ticket'ını kapatmalısın.`,
            ephemeral: true,
          });
        }
      }

      // GENEL DESTEK
      if (interaction.customId === 'genel_destek_modal') {
        destekEkibiRolIDList = (destekEkibiRolIDs.genel_destek || []).filter(Boolean);
        categoryId = categoryIds.genel_destek;
        ticketTypeForTopic = "genel_destek";
        const reason = interaction.fields.getTextInputValue('ticket_reason');

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          },
          ...destekEkibiRolIDList.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          })),
        ];

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          topic: `Ticket Türü: ${ticketTypeForTopic} | Açılış: ${new Date().toISOString()}`,
          permissionOverwrites,
        });

        const destekRolTag = destekEkibiRolIDList.map(id => `<@&${id}>`).join(' ') || "@here";

        const embed = new EmbedBuilder()
          .setTitle("📩 Genel Destek")
          .setDescription(`**Sebep:**\n${reason}`)
          .setFooter({ text: `Talep Sahibi: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setColor('Blue');

        const claimButton = new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Ticket Sahiplen')
          .setStyle(ButtonStyle.Success);

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger);

        await channel.send({
          content: `Merhaba, destek talebiniz alınmıştır ${interaction.user}, ${destekRolTag} ekibimiz en kısa sürede yardımcı olacaktır.`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(claimButton, closeButton)],
        });

        return await interaction.reply({
          content: `✅ Ticket oluşturuldu: ${channel}`,
          ephemeral: true,
        });
      }

      // OYUNCU ŞİKAYET
      if (interaction.customId === 'oyuncu_sikayet_modal') {
        destekEkibiRolIDList = (destekEkibiRolIDs.oyuncu_sikayet || []).filter(Boolean);
        categoryId = categoryIds.oyuncu_sikayet;
        ticketTypeForTopic = "oyuncu_sikayet";
        const kisi = interaction.fields.getTextInputValue('kisi_ismi');
        const olay = interaction.fields.getTextInputValue('olay_anlatimi');

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          },
          ...destekEkibiRolIDList.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          })),
        ];

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          topic: `Ticket Türü: ${ticketTypeForTopic} | Açılış: ${new Date().toISOString()}`,
          permissionOverwrites,
        });

        const destekRolTag = destekEkibiRolIDList.map(id => `<@&${id}>`).join(' ') || "@here";

        const embed = new EmbedBuilder()
          .setTitle("🚨 Oyuncu Şikayeti")
          .addFields(
            { name: "Şikayet Edilen Kişi", value: kisi, inline: false },
            { name: "Olayın Açıklaması", value: olay, inline: false },
          )
          .setFooter({ text: `Şikayet eden: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setColor('Red');

        const claimButton = new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Ticket Sahiplen')
          .setStyle(ButtonStyle.Success);

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger);

        await channel.send({
          content: `Merhaba, destek talebiniz alınmıştır ${interaction.user}, ${destekRolTag} ekibimiz en kısa sürede yardımcı olacaktır.`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(claimButton, closeButton)],
        });

        return await interaction.reply({
          content: `✅ Oyuncu şikayet ticket'ı oluşturuldu: ${channel}`,
          ephemeral: true,
        });
      }

      // YETKİLİ ŞİKAYET
      if (interaction.customId === 'yetkili_sikayet_modal') {
        destekEkibiRolIDList = (destekEkibiRolIDs.yetkili_sikayet || []).filter(Boolean);
        categoryId = categoryIds.yetkili_sikayet;
        ticketTypeForTopic = "yetkili_sikayet";
        const yetkili = interaction.fields.getTextInputValue('yetkili_ismi');
        const olay = interaction.fields.getTextInputValue('olay_anlatimi');

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          },
          ...destekEkibiRolIDList.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          })),
        ];

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          topic: `Ticket Türü: ${ticketTypeForTopic} | Açılış: ${new Date().toISOString()}`,
          permissionOverwrites,
        });

        const destekRolTag = destekEkibiRolIDList.map(id => `<@&${id}>`).join(' ') || "@here";

        const embed = new EmbedBuilder()
          .setTitle("🚨 Yetkili Şikayeti")
          .addFields(
            { name: "Şikayet Edilen Yetkili", value: yetkili, inline: false },
            { name: "Olayın Açıklaması", value: olay, inline: false },
          )
          .setFooter({ text: `Şikayet eden: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setColor('Red');

        const claimButton = new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Ticket Sahiplen')
          .setStyle(ButtonStyle.Success);

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger);

        await channel.send({
          content: `Merhaba, destek talebiniz alınmıştır ${interaction.user}, ${destekRolTag} ekibimiz en kısa sürede yardımcı olacaktır.`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(claimButton, closeButton)],
        });

        return await interaction.reply({
          content: `✅ Yetkili şikayet ticket'ı oluşturuldu: ${channel}`,
          ephemeral: true,
        });
      }

      // BAN İTİRAZ
      if (interaction.customId === 'ban_itiraz_modal') {
        destekEkibiRolIDList = (destekEkibiRolIDs.ban_itiraz || []).filter(Boolean);
        categoryId = categoryIds.ban_itiraz;
        ticketTypeForTopic = "ban_itiraz";
        const adiniz = interaction.fields.getTextInputValue('adiniz');
        const steamId = interaction.fields.getTextInputValue('steam64id');

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          },
          ...destekEkibiRolIDList.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          })),
        ];

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          topic: `Ticket Türü: ${ticketTypeForTopic} | Açılış: ${new Date().toISOString()}`,
          permissionOverwrites,
        });

        const destekRolTag = destekEkibiRolIDList.map(id => `<@&${id}>`).join(' ') || "@here";

        const embed = new EmbedBuilder()
          .setTitle("⛔ Ban İtirazı")
          .addFields(
            { name: "Adınız", value: adiniz, inline: false },
            { name: "Steam64 ID", value: steamId, inline: false },
          )
          .setFooter({ text: `İtiraz eden: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setColor('Orange');

        const claimButton = new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Ticket Sahiplen')
          .setStyle(ButtonStyle.Success);

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger);

        await channel.send({
          content: `Merhaba, destek talebiniz alınmıştır ${interaction.user}, ${destekRolTag} ekibimiz en kısa sürede yardımcı olacaktır.`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(claimButton, closeButton)],
        });

        return await interaction.reply({
          content: `✅ Ban itiraz ticket'ı oluşturuldu: ${channel}`,
          ephemeral: true,
        });
      }

      // YETKİLİ BAŞVURU
      if (interaction.customId === 'yetkili_basvuru_modal') {
        destekEkibiRolIDList = (destekEkibiRolIDs.yetkili_basvuru || []).filter(Boolean);
        categoryId = categoryIds.yetkili_basvuru;
        ticketTypeForTopic = "yetkili_basvuru";
        const adYas = interaction.fields.getTextInputValue('ad_yas');
        const deneyim = interaction.fields.getTextInputValue('deneyim');
        const neden = interaction.fields.getTextInputValue('neden');
        const klanlar = interaction.fields.getTextInputValue('klanlar') || '-';
        const aktiflik = interaction.fields.getTextInputValue('aktiflik');

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          },
          ...destekEkibiRolIDList.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          })),
        ];

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          topic: `Ticket Türü: ${ticketTypeForTopic} | Açılış: ${new Date().toISOString()}`,
          permissionOverwrites,
        });

        const destekRolTag = destekEkibiRolIDList.map(id => `<@&${id}>`).join(' ') || "@here";

        const embed = new EmbedBuilder()
          .setTitle("📝 Yetkili Başvuru")
          .addFields(
            { name: "Adınız ve Yaşınız", value: adYas, inline: false },
            { name: "Daha önce yetkili oldunuz mu?", value: deneyim, inline: false },
            { name: "Neden yetkili olmak istiyorsunuz?", value: neden, inline: false },
            { name: "Geçmiş ve şu anki klanınız", value: klanlar, inline: false },
            { name: "Günlük aktiflik süreniz (saat)", value: aktiflik, inline: false },
          )
          .setFooter({ text: `Başvuru sahibi: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setColor('Green');

        const claimButton = new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Ticket Sahiplen')
          .setStyle(ButtonStyle.Success);

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger);

        await channel.send({
          content: `Merhaba, başvurunuz alınmıştır ${interaction.user}, ${destekRolTag} ekibimiz en kısa sürede inceleyecektir.`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(claimButton, closeButton)],
        });

        return await interaction.reply({
          content: `✅ Yetkili başvuru ticket'ı oluşturuldu: ${channel}`,
          ephemeral: true,
        });
      }

      // WHITELIST BAŞVURU
      if (interaction.customId === 'whitelist_basvuru_modal') {
        destekEkibiRolIDList = (destekEkibiRolIDs.whitelist_basvuru || []).filter(Boolean);
        categoryId = categoryIds.whitelist_basvuru;
        ticketTypeForTopic = "whitelist_basvuru";
        const whitelistTipi = interaction.fields.getTextInputValue('whitelist_tipi');

        const permissionOverwrites = [
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          {
            id: interaction.user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          },
          ...destekEkibiRolIDList.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'EmbedLinks', 'AttachFiles'],
          })),
        ];

        const channel = await interaction.guild.channels.create({
          name: channelName,
          type: 0,
          parent: categoryId,
          topic: `Ticket Türü: ${ticketTypeForTopic} | Açılış: ${new Date().toISOString()}`,
          permissionOverwrites,
        });

        const destekRolTag = destekEkibiRolIDList.map(id => `<@&${id}>`).join(' ') || "@here";

        const embed = new EmbedBuilder()
          .setTitle("⚡ Whitelist Başvurusu")
          .addFields(
            { name: "Başvuru Türü", value: whitelistTipi, inline: false }
          )
          .setFooter({ text: `Başvuru sahibi: ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setColor('Purple');

        const claimButton = new ButtonBuilder()
          .setCustomId('ticket_claim')
          .setLabel('Ticket Sahiplen')
          .setStyle(ButtonStyle.Success);

        const closeButton = new ButtonBuilder()
          .setCustomId('ticket_close')
          .setLabel('Ticket Kapat')
          .setStyle(ButtonStyle.Danger);

        await channel.send({
          content: `Merhaba, başvurunuz alınmıştır ${interaction.user}, ${destekRolTag} ekibimiz en kısa sürede inceleyecektir.`,
          embeds: [embed],
          components: [new ActionRowBuilder().addComponents(claimButton, closeButton)],
        });

        return await interaction.reply({
          content: `✅ Whitelist başvuru ticket'ı oluşturuldu: ${channel}`,
          ephemeral: true,
        });
      }

      // TICKET KAPATMA MODALI
      if (interaction.customId === 'ticket_close_modal') {
        const tumDestekRolleri = Object.values(destekEkibiRolIDs).flat().filter(Boolean);
        const reason = interaction.fields.getTextInputValue('close_reason');
        const channel = interaction.channel;

        await channel.setName(`closed-${channel.name}`).catch(() => {});

        await channel.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: ['ViewChannel'],
          },
          ...tumDestekRolleri.map(rolID => ({
            id: rolID,
            allow: ['ViewChannel', 'SendMessages'],
          })),
        ]);

        const closeEmbed = new EmbedBuilder()
          .setTitle('Ticket Kapatıldı')
          .setDescription(`**Sebep:**\n${reason}`)
          .setColor('Red')
          .setFooter({ text: `Kapatıldı: ${interaction.user.tag}` })
          .setTimestamp();

        await channel.send({ embeds: [closeEmbed] });

        // --- TRANSCRIPT ---
        try {
          let kanalAdiParcalari = channel.name.replace("closed-", "").split('-');
          let ticketOwnerUsername = kanalAdiParcalari.length >= 2 ? kanalAdiParcalari[1] : "Bilinmiyor";
          let ticketOwnerMention = ticketOwnerUsername ? `@${ticketOwnerUsername}` : "Bilinmiyor";

          const ticketCloserTag = interaction.user.tag;
          const ticketCloserMention = `<@${interaction.user.id}>`;
          const ticketCloseTime = new Date().toLocaleString();

          let ticketTopic = channel.topic || "";
          let acilisTarihi = "Bilinmiyor";
          let ticketTuru = "Bilinmiyor";
          let match = ticketTopic.match(/Ticket Türü: (.+?) \| Açılış: (.+)/);
          if (match) {
            ticketTuru = match[1];
            acilisTarihi = new Date(match[2]).toLocaleString();
          }

          const messages = await channel.messages.fetch({ limit: 100 });
          const sortedMessages = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

          let transcriptText = `=== Ticket Transcript ===\n`;
          transcriptText += `Ticket Açan: ${ticketOwnerUsername} (${ticketOwnerMention})\n`;
          transcriptText += `Ticket Türü: ${ticketTuru}\n`;
          transcriptText += `Ticket Açılış Zamanı: ${acilisTarihi}\n`;
          transcriptText += `Ticket Kapatılan: ${ticketCloserTag} (${ticketCloserMention})\n`;
          transcriptText += `Ticket Kapanış Zamanı: ${ticketCloseTime}\n`;
          transcriptText += `Kapatma Sebebi: ${reason}\n`;
          transcriptText += `=========================\n\n`;

          for (const msg of sortedMessages) {
            transcriptText += `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}\n`;
          }

          const transcriptEmbed = new EmbedBuilder()
            .setTitle(`Ticket Transcript: ${channel.name}`)
            .setDescription(
              transcriptText.length > 4000
                ? transcriptText.slice(0, 3990) + "\n...(uzun transcript, kesildi)"
                : transcriptText || "Mesaj bulunamadı."
            )
            .setColor('Grey')
            .setFooter({ text: `Kapatıldı: ${interaction.user.tag}` })
            .setTimestamp();

          const transcriptChannel = await interaction.guild.channels.fetch(transcriptChannelId);
          if (transcriptChannel && transcriptChannel.isTextBased()) {
            await transcriptChannel.send({ embeds: [transcriptEmbed] });
          }
        } catch (err) {
          console.error("Transcript gönderilemedi:", err);
        }
        try {
          await channel.delete("Ticket kapatıldı ve transcript gönderildi.");
        } catch (err) {
          console.error("Ticket kanalı silinemedi:", err);
        }
        return;
      }
    }

    // BUTTON INTERACTION (tekrar, claim ve close işlemleri için)
    if (interaction.isButton()) {
      const channel = interaction.channel;
      const tumDestekRolleri = Object.values(destekEkibiRolIDs).flat().filter(Boolean);

      if (interaction.customId === 'ticket_claim') {
        if (!interaction.member.roles.cache.some(r => tumDestekRolleri.includes(r.id))) {
          return interaction.reply({ content: '❌ Bu ticketi sahiplenme yetkiniz yok.', ephemeral: true });
        }
        if (channel.topic && channel.topic.includes('Sahiplenen:')) {
          return interaction.reply({ content: '⚠️ Bu ticket zaten sahiplenilmiş.', ephemeral: true });
        }
        await channel.setTopic(`Sahiplenen: ${interaction.user.tag}${channel.topic ? ' | ' + channel.topic : ''}`);
        await interaction.reply({ content: `✅ Ticket başarıyla sahiplenildi: ${interaction.user}`, ephemeral: true });
        await channel.send(`${interaction.user} ticketi sahiplenmiştir.`);

        // === CLAIM İSTATİSTİĞİ VERİTABANINA EKLENİYOR ===
        const user = interaction.user;
        db.run(
          `INSERT INTO claim_stats (user_id, user_tag, claim_count)
           VALUES (?, ?, 1)
           ON CONFLICT(user_id) DO UPDATE SET claim_count = claim_count + 1, user_tag = ?`,
          [user.id, user.tag, user.tag]
        );
        // ===============================================

        return;
      }

      if (interaction.customId === 'ticket_close') {
        const ticketOwnerUsername = channel.name.split('-')[1];
        if (interaction.user.username !== ticketOwnerUsername && !interaction.member.roles.cache.some(r => tumDestekRolleri.includes(r.id))) {
          return interaction.reply({ content: '❌ Bu ticketi kapatma yetkiniz yok.', ephemeral: true });
        }
        const modal = new ModalBuilder()
          .setCustomId('ticket_close_modal')
          .setTitle('Ticket Kapatma Sebebi');
        const reasonInput = new TextInputBuilder()
          .setCustomId('close_reason')
          .setLabel('Ticket kapatma sebebiniz')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
        await interaction.showModal(modal);
        return;
      }
    }
  },
};