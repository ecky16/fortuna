const fetch = require('node-fetch');
const Mikrotik = require('mikrotik-node');

export default async function handler(req, res) {
    // Menghindari error jika diakses langsung lewat browser
    if (req.method !== 'POST') {
        return res.status(200).send('Bot MikroTik Mas Ecky Ready!');
    }

    const { message } = req.body;
    if (!message || !message.text) return res.status(200).send('ok');

    const chatId = message.chat.id;
    const lines = message.text.split('\n');
    const command = lines[0].toLowerCase(); // Baris 1: /hpibuk_off
    const macTarget = lines[1] ? lines[1].trim() : null; // Baris 2: MAC

    // Konfigurasi dari Environment Variables Vercel
    const device = new Mikrotik({
    host: process.env.MT_HOST,
    user: process.env.MT_USER,
    password: process.env.MT_PASSWORD,
    port: process.env.MT_PORT || 7072 // Mengambil dari Vercel, jika kosong pakai 7072
});

    try {
        if (!macTarget) {
            await sendTelegram(chatId, "⚠️ Mas, masukkan MAC Address di baris kedua ya.");
            return res.status(200).send('ok');
        }

        await device.connect();

        if (command.includes('_off')) {
            // Aktifkan Rule Drop (Internet Mati)
            await device.write([
                '/ip/firewall/filter/enable',
                `=.id=[/ip/firewall/filter/find src-mac-address="${macTarget}"]`
            ]);
            await sendTelegram(chatId, `🚫 Akses untuk [${macTarget}] Berhasil DIMATIKAN.`);
        } 
        else if (command.includes('_on')) {
            // Matikan Rule Drop (Internet Nyala)
            await device.write([
                '/ip/firewall/filter/disable',
                `=.id=[/ip/firewall/filter/find src-mac-address="${macTarget}"]`
            ]);
            await sendTelegram(chatId, `✅ Akses untuk [${macTarget}] Berhasil DINYALAKAN.`);
        }
        
        device.close();
    } catch (err) {
        console.error(err);
        await sendTelegram(chatId, "❌ Wah, gagal konek ke MikroTik: " + err.message);
    }

    return res.status(200).send('ok');
}

async function sendTelegram(chatId, text) {
    const token = process.env.BOT_TOKEN;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
    });
}
