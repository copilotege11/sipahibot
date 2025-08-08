const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Bot mesajlarına tepki verme
    if (message.author.bot) return;

    // Küçük harfe çevirerek kontrol et
    const content = message.content.toLowerCase();

    // Otomatik cevaplar
    if (content === "sa" || content === "selam" || content === "selamun aleyküm") {
      return message.reply("as");
    }

    if (content.includes("nasılsın")) {
      return message.reply("İyiyim sen nasılsın? 🤖");
    }

    if (content.includes("destek")) {
      return message.reply("https://discord.com/channels/1393720845892845578/1393721674251239585 Bu kanaldan ticket açabilirsiniz!");
    }

    if (content.includes("naber")) {
      return message.reply("İyidir sen?");
    }

    if (content.includes("yarrak")) {
      return message.reply("Çevir kendine sok");
    }
    // İstediğin kadar kelime ekleyebilirsin
  }
};
