const MikrotikClient = require('mikrotik-client');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const lines = message.text.split('\n'); // Memecah pesan per baris
  const command = lines[0].toLowerCase(); // Baris 1: Perintah (/hpibuk_off)
  const macTarget = lines[1]; // Baris 2: MAC Address

  const mtConfig = {
    host: process.env.MT_HOST,
    user: process.env.MT_USER,
    password: process.env.MT_PASSWORD,
    port: 8728
  };

  const client = new MikrotikClient(mtConfig);

  try {
    if (command.includes('_off') && macTarget) {
      await client.connect();
      // Perintah: Cari rule yang src-mac-address nya sesuai, lalu ENABLE (Blokir)
      await client.write([
        '/ip/firewall/filter/enable',
        `=.id=[/ip/firewall/filter/find src-mac-address="${macTarget.trim()}"]`
      ]);
      await sendTelegram(chatId, `🚫 Perangkat [${macTarget}] Berhasil DIBLOKIR.`);
    } 
    else if (command.includes('_on') && macTarget) {
      await client.connect();
      // Perintah: Cari rule yang src-mac-address nya sesuai, lalu DISABLE (Lepas Blokir)
      await client.write([
        '/ip/firewall/filter/disable',
        `=.id=[/ip/firewall/filter/find src-mac-address="${macTarget.trim()}"]`
      ]);
      await sendTelegram(chatId, `✅ Perangkat [${macTarget}] Kembali ONLINE.`);
    }
  } catch (err) {
    await sendTelegram(chatId, "⚠️ Gagal konek ke MikroTik: " + err.message);
  } finally {
    client.close();
  }

  return res.status(200).send('OK');
}

async function sendTelegram(chatId, text) {
  const token = process.env.BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}
