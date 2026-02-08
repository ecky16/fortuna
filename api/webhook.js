const fetch = require('node-fetch');

export default async function handler(req, res) {
  const { message } = req.body;
  if (message) {
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: message.chat.id, text: "Halo Mas Ecky! Bot sudah bangun." })
    });
  }
  return res.status(200).send('ok');
}
