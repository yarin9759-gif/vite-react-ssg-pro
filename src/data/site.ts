// Business details shown across the site.
export const site = {
  name: 'בונים מקיר לקיר',
  owner: 'ירין שמואל',
  tagline: 'חומרי בניין, צבעים ואיטום',
  phone: '054-945-7447',
  // International format without "+" or leading zero, used for wa.me links
  whatsapp: '972549457447',
  email: 'yarin9759@gmail.com',
  // PayPal account (email) that receives payments
  paypal: 'yarin9759@gmail.com',
  // Temporarily off: hides the PayPal button (cart) and card (contact). Set to true to bring them back.
  paypalEnabled: false,
  address: 'רחוב המעיין',
  hours: [
    { days: 'ראשון–חמישי', time: '07:00–17:00' },
    { days: 'שישי וערבי חג', time: '07:00–13:00' },
  ],
};

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${site.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

// PayPal checkout for a fixed amount in ILS, paid to site.paypal
export function paypalLink(amount: number, itemName: string) {
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: site.paypal,
    item_name: itemName,
    amount: amount.toFixed(2),
    currency_code: 'ILS',
    charset: 'utf-8',
  });
  return `https://www.paypal.com/cgi-bin/webscr?${params}`;
}
