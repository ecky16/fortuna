const MikrotikClient = require('mikrotik-client');

export default async function handler(req, res) {
  // 1. Kirim respon OK secepat mungkin ke Telegram supaya tidak dianggap error 500
  if (req.method !== 'POST') return res.status(200).json({ status: 'ok' });

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('ok');

  const chatId = message.chat.id;
  const text = message.text;

  try {
    // 2. Cek apakah ini perintah yang benar
    if (text.includes('/hpibuk')) {
      // Masukkan langsung ke log vercel untuk debugging
      console.log("Mencoba konek ke MikroTik...");
      
      const client = new MikrotikClient({
        host: process.env.MT_HOST,
        user: process.env.MT_USER,
        password: process.env.MT_PASSWORD,
        port: 7072
      });

      await client.connect();
      // Tes sederhana: ambil identitas mikrotik
      await client.write(['/system/identity/print']);
      await sendTelegram(chatId, "✅ Koneksi ke MikroTik Sukses!");
      client.close();
    }
  } catch (err) {
    console.error("Detail Error:", err.message);
    await sendTelegram(chatId, "❌ Error: " + err.message);
  }

  return res.status(200).send('ok');
}

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}
