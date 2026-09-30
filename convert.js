const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { url, coupon } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: 'URL do produto é obrigatória.' });
    }

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 12000
    });

    const finalUrl = response.request?.res?.responseUrl || url;
    const $ = cheerio.load(response.data);

    let title = $('h1.ui-pdp-title').text().trim() \vert{}\vert{}$('meta[property="og:title"]').attr('content') ||
                $('title').text().replace('- Mercado Livre', '').trim() ||
                'PRODUTO EM OFERTA';

    let originalPrice = $('.ui-pdp-price__part--original .andes-money-amount__fraction').first().text().trim();
    let currentPrice = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim() \vert{}\vert{}$('.andes-money-amount__fraction').first().text().trim();
    let cents = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim() || '00';

    let installments = $('.ui-pdp-payment-icon-description').first().text().trim() \vert{}\vert{}$('.ui-pdp-price__subtitles').first().text().trim();

    const cleanUrl = finalUrl.split('?')[0].split('#')[0];
    const affiliateUrl = `${cleanUrl}?matt_tool=pejo6291542`;

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
      card += `\n🎟️ Utilize o código: *${coupon.trim().toUpperCase()}*\n`;
    }

    card += `\n🔗 ${affiliateUrl}\n`;
    card += `\n🟢 *Grupo das Ofertas - WhatsApp:* whats.ly/Descontos`;

    return res.status(200).json({
      success: true,
      data: {
        title,
        affiliateUrl,
        formattedCard: card
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao extrair dados da oferta do Mercado Livre.',
      details: error.message
    });
  }
};