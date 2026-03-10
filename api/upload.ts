import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { image, caption } = req.body; // Base64 (without prefix) and optional caption
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return res.status(500).send('Discord Webhook URL is not configured.');
  }

  if (!image) {
    return res.status(400).send('No image data provided.');
  }

  try {
    // Base64 to Buffer
    const buffer = Buffer.from(image, 'base64');
    
    // Create FormData manually
    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('file', blob, 'capture.jpg');
    
    // キャプションがあればそれを使用、なければ時刻のみ
    const content = caption || `Captured at ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`;
    formData.append('content', content);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      return res.status(200).send('OK');
    } else {
      const errorText = await response.text();
      return res.status(response.status).send(`Discord API Error: ${errorText}`);
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).send(`Server Error: ${error.message}`);
  }
}
