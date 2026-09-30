// api/convert.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { url, coupon, groupLink } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL do produto é obrigatória' });
  }

  try {
    // 1. Seguir redirecionamentos (ex: links meli.la) para pegar a URL final
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      maxRedirects: 5
    });

    const finalUrl = response.request.res.responseUrl || url;
    const $ = cheerio.load(response.data);

    // 2. Extrair informações do produto
    const title = $('h1.ui-pdp-title').text().trim() \vert{}\vert{}$('meta[property="og:title"]').attr('content') || 'PRODUTO EM OFERTA';
    
    // Preços
    const originalPriceText = $('.ui-pdp-price__part--original .andes-money-amount__fraction').first().text().trim();
    const currentPriceText = $('.ui-pdp-price__second-line .andes-money-amount__fraction').first().text().trim() \vert{}\vert{}$('.andes-money-amount__fraction').first().text().trim();
    const centsText = $('.ui-pdp-price__second-line .andes-money-amount__cents').first().text().trim() || '00';

    // Parcelamento
    const installmentsText = $('.ui-pdp-payment-icon-description').text().trim() \vert{}\vert{}$('.ui-pdp-price__subtitles').text().trim();

    // 3. Montar Link de Afiliado com sua Tag
    const cleanUrl = finalUrl.split('?')[0];
    const affiliateUrl = `${cleanUrl}?matt_tool=pejo6291542`;

    // 4. Formatar mensagem para o WhatsApp
    const currentPriceFormatted = `R$ ${currentPriceText},${centsText}`;
    
    let card = `*${title.toUpperCase()}*\n\n`;
    
    if (originalPriceText) {
      card += `❌ ~DE R$ ${originalPriceText},00~\n`;
    }
    
    card += `🔥 *POR ${currentPriceFormatted}*\n`;

    if (installmentsText) {
      card += `💳 ${installmentsText}\n`;
    }

    if (coupon) {
      card += `\n🤑 *Com cupom:* ${coupon.code ? coupon.code : coupon}\n`;
      card += `🎟️ Utilize o código: *${coupon.code ? coupon.code : coupon}*\n`;
    }

    card += `\n🔗 ${affiliateUrl}\n`;

    if (groupLink) {
      card += `\n🟢 *Grupo das Ofertas - WhatsApp:* ${groupLink}`;
    } else {
      card += `\n🟢 *Grupo das Ofertas - WhatsApp:* whats.ly/Descontos`;
    }

    return res.status(200).json({
      success: true,
      data: {
        title,
        originalPrice: originalPriceText ? `R$ ${originalPriceText},00` : null,
        currentPrice: currentPriceFormatted,
        affiliateUrl,
        formattedCard: card
      }
    });

  } catch (error) {
    return res.status(500).json({ error: 'Erro ao extrair dados do produto', details: error.message });
  }
}