// start.js

require('dotenv').config();
const { spawn } = require('child_process');

console.log("🚀 Başlatılıyor...");

// Komutları deploy et
const deploy = spawn('node', ['deploy-commands.js'], { stdio: 'inherit' });

deploy.on('close', (code) => {
    if (code === 0) {
        console.log("✅ Komutlar yüklendi. Bot başlatılıyor...");
        // Botu başlat
        const bot = spawn('node', ['index.js'], { stdio: 'inherit' });

        bot.on('close', (code) => {
            console.log(`❌ Bot kapandı. Kod: ${code}`);
        });
    } else {
        console.error("❌ Komut yükleme sırasında hata oluştu.");
    }
});
