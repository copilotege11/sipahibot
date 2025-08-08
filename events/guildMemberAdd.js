const { AttachmentBuilder } = require("discord.js");
const Canvas = require("canvas");
const path = require("path");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    const OTOMATIK_ROL_ID = "1393949458198302841";
    const HOSGELDIN_KANAL_ID = "1398619660970233907";
    const LOGO_PATH = path.join(__dirname, "sipahilogo.png");
    const KNIGHT_PATH = path.join(__dirname, "knight.jpg");

    // Otomatik rol ver
    try {
      await member.roles.add(OTOMATIK_ROL_ID);
    } catch (error) {
      console.error("Rol verilemedi:", error);
    }

    const username = member.user.username;
    const avatarURL = member.user.displayAvatarURL({ extension: "png" });

    async function createProBotWelcome(username, message, avatarURL, logoPath, knightPath) {
      // Yeni boyut: 500x188
      const width = 500;
      const height = 188;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Arka plan şövalye
      const knight = await Canvas.loadImage(knightPath);
      ctx.drawImage(knight, (width - 500) / 2, (height - 281) / 2, 500, 281);

      // Overlay
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = "#181a20";
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      // Çapraz şeritler
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.rotate(-0.13);
      for (let i = -2; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? "#23272A" : "#202329";
        ctx.fillRect(i * 90, -80, 60, height + 150);
      }
      ctx.restore();

      // Hoşgeldin kutusu
      const boxX = 30, boxY = 50, boxW = width - 60, boxH = 78;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 16;
      ctx.globalAlpha = 0.56;
      ctx.beginPath();
      ctx.moveTo(boxX + 20, boxY);
      ctx.lineTo(boxX + boxW - 20, boxY);
      ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + 20);
      ctx.lineTo(boxX + boxW, boxY + boxH - 20);
      ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - 20, boxY + boxH);
      ctx.lineTo(boxX + 20, boxY + boxH);
      ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - 20);
      ctx.lineTo(boxX, boxY + 20);
      ctx.quadraticCurveTo(boxX, boxY, boxX + 20, boxY);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
      gradient.addColorStop(0, "#31343A");
      gradient.addColorStop(1, "#4A4C52");
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();

      // Avatar kutusu
      const avatarR = 30;
      const avatarCX = boxX + avatarR + 8;
      const avatarCY = boxY + boxH / 2;
      ctx.save();
      ctx.shadowColor = "#000";
      ctx.shadowBlur = 7;
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = "#23272A";
      ctx.fill();
      ctx.restore();

      // Avatar resmi
      const avatar = await Canvas.loadImage(avatarURL);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR - 3, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(
        avatar,
        avatarCX - avatarR + 3,
        avatarCY - avatarR + 3,
        (avatarR - 3) * 2,
        (avatarR - 3) * 2
      );
      ctx.restore();

      // Avatar kenarlığı
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR - 3, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
      ctx.restore();

      // Yazılar
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.30)";
      ctx.shadowBlur = 3;
      ctx.fillText(username, avatarCX + avatarR + 20, avatarCY - 20);
      ctx.font = "15px Arial";
      ctx.shadowBlur = 2;
      ctx.fillText(message, avatarCX + avatarR + 20, avatarCY + 4);

      // Logo
      const logo = await Canvas.loadImage(logoPath);
      const logoSize = 50;
      const logoX = boxX + boxW - logoSize - 16;
      const logoY = boxY + (boxH - logoSize) / 2;
      ctx.save();
      ctx.globalAlpha = 0.97;
      ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      ctx.restore();

      return canvas.toBuffer("image/jpeg");
    }

    const buffer = await createProBotWelcome(
      username,
      "Sunucumuza hoşgeldiniz!",
      avatarURL,
      LOGO_PATH,
      KNIGHT_PATH
    );

    const channel = member.guild.channels.cache.get(HOSGELDIN_KANAL_ID);
    if (channel) {
      channel.send({
        content: `<@${member.id}>`,
        files: [new AttachmentBuilder(buffer, { name: "welcome.jpg" })],
      });
    }
  },
};
