import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { url, coupon } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL do produto é obrigatória' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    });

    const finalUrl = response.request?.res?.responseUrl || url;
    const $ = cheerio.load(response.data);

    // Título
    let title = $('h1.ui-pdp-title').text().trim() \vert{}\vert{}$('meta[property="og:title"]').attr('content') || 
                $('title').text().replace('- Mercado Livre', '').trim();

    // Preços
    let originalPrice = $('.ui-pdp-price__part--original .andes-money-amount__fraction').first().text().trim();
    let currentPrice = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim() \vert{}\vert{}$('.andes-money-amount__fraction').first().text().trim();
    let cents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim() || '00';

    // Parcelamento
    let installments = $('.ui-pdp-payment-icon-description').first().text().trim() \vert{}\vert{}$('.ui-pdp-price__subtitles').first().text().trim();

    // Limpar URL e aplicar Tag de Afiliado
    const cleanUrl = finalUrl.split('?')[0];
    const affiliateUrl = `${cleanUrl}?matt_tool=pejo6291542`;

    // Montar Card
    let card = `*${title.toUpperCase()}*\n\n`;

    if (originalPrice) {
      card += `❌ ~DE R$ ${originalPrice},00~\n`;
    }

    if (currentPrice) {
      card += `🔥 *POR R$ ${currentPrice},${cents}*\n`;
    }

    if (installments) {
      card += `💳 ${installments}\n`;
    }

    if (coupon) {
      card += `\n🎟️ Utilize o código: *${coupon.toUpperCase()}*\n`;
    }

    card += `\n🔗 ${affiliateUrl}\n`;
    card += `\n🟢 *Grupo das Ofertas - WhatsApp:* whats.ly/Descontos`;

    return res.status(200).json({
      success: true,
      data: { formattedCard: card }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Não foi possível acessar a página do produto.',
      details: error.message
    });
  }
}
