// Business details shown across the site. Replace the placeholders with the real ones.
export const site = {
  name: 'בונים פלוס',
  tagline: 'חומרי בניין, צבעים ואיטום',
  phone: '050-000-0000',
  // International format without "+" or leading zero, used for wa.me links
  whatsapp: '972500000000',
  email: 'info@example.co.il',
  address: 'רחוב התעשייה 1, אזור התעשייה',
  hours: [
    { days: 'ראשון–חמישי', time: '07:00–17:00' },
    { days: 'שישי וערבי חג', time: '07:00–13:00' },
  ],
};

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${site.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
