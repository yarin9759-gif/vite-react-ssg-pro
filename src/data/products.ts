import { BrickWall, Droplets, Hammer, PaintRoller, type LucideIcon } from 'lucide-react';

// To add a new category: add its id to CategoryId, an entry to `categories`, and products that use it.
export type CategoryId = 'building' | 'paint' | 'sealing' | 'tools';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: LucideIcon;
  // Full Tailwind class strings (kept literal so Tailwind picks them up)
  tint: string;
}

export interface Product {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  unit: string;
  // Price in ILS including VAT
  price: number;
  // Optional path under /public, e.g. "/images/products/cement.webp"
  image?: string;
}

export const categories: Category[] = [
  {
    id: 'building',
    name: 'חומרי בניין',
    description: 'מלט, טיט, בלוקים, דבקים וטיח',
    icon: BrickWall,
    tint: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'paint',
    name: 'צבעים',
    description: 'צבעי פנים וחוץ, יסוד ושפכטל',
    icon: PaintRoller,
    tint: 'bg-sky-100 text-sky-700',
  },
  {
    id: 'sealing',
    name: 'איטום',
    description: 'איטום גגות, חדרים רטובים ויריעות',
    icon: Droplets,
    tint: 'bg-teal-100 text-teal-700',
  },
  {
    id: 'tools',
    name: 'כלי עבודה ואביזרים',
    description: 'כלים ואביזרים לבנאי ולצבעי',
    icon: Hammer,
    tint: 'bg-stone-200 text-stone-700',
  },
];

// Example catalog and prices - replace with the real inventory.
export const products: Product[] = [
  // Building materials
  { id: 'cement-portland', name: 'מלט פורטלנד', category: 'building', description: 'מלט אפור לעבודות בטון, יציקות וטיח', unit: 'שק 25 ק״ג', price: 32 },
  { id: 'mortar-ready', name: 'טיט מוכן לבנייה', category: 'building', description: 'תערובת יבשה מוכנה לבניית בלוקים', unit: 'שק 40 ק״ג', price: 28 },
  { id: 'block-20', name: 'בלוק בטון 20 ס״מ', category: 'building', description: 'בלוק איכותי לקירות חוץ ופנים', unit: 'יחידה', price: 6.5 },
  { id: 'tile-adhesive-c2te', name: 'דבק קרמיקה C2TE', category: 'building', description: 'דבק משופר לאריחים גדולים, פנים וחוץ', unit: 'שק 25 ק״ג', price: 55 },
  { id: 'plaster-gypsum', name: 'טיח גבס לפנים', category: 'building', description: 'טיח חלק לקירות ותקרות פנים', unit: 'שק 30 ק״ג', price: 45 },
  { id: 'sand-washed', name: 'חול שטוף', category: 'building', description: 'חול נקי לתערובות בטון וטיט', unit: 'שק 25 ק״ג', price: 15 },

  // Paint
  { id: 'paint-interior-white', name: 'צבע אקרילי לקירות פנים – לבן', category: 'paint', description: 'צבע רחיץ בגימור מט, כיסוי גבוה', unit: 'דלי 18 ליטר', price: 320 },
  { id: 'paint-exterior', name: 'צבע אקרילי לקירות חוץ', category: 'paint', description: 'עמיד לשמש ולגשם, מונע התקלפות', unit: 'דלי 18 ליטר', price: 420 },
  { id: 'primer', name: 'פריימר יסוד', category: 'paint', description: 'שכבת יסוד לשיפור אחיזת הצבע', unit: 'גלון 4 ליטר', price: 95 },
  { id: 'enamel-paint', name: 'צבע שמן לעץ ומתכת', category: 'paint', description: 'גימור מבריק ועמיד לדלתות, מעקות ורהיטים', unit: '1 ליטר', price: 65 },
  { id: 'spackle', name: 'שפכטל מוכן לקירות', category: 'paint', description: 'למילוי סדקים והחלקת קירות לפני צביעה', unit: 'דלי 5 ק״ג', price: 55 },

  // Sealing
  { id: 'roof-acrylic', name: 'איטום אקרילי לבן לגגות', category: 'sealing', description: 'מחזיר קרינה, גמיש ועמיד לאורך שנים', unit: 'דלי 18 ליטר', price: 380 },
  { id: 'roof-bitumen', name: 'איטום ביטומני לגגות', category: 'sealing', description: 'שכבת הגנה ביטומנית לגגות בטון', unit: 'דלי 18 ק״ג', price: 260 },
  { id: 'cement-sealer-2k', name: 'איטום צמנטי דו־רכיבי', category: 'sealing', description: 'לחדרי רטובים, מרפסות ובריכות', unit: 'ערכה 25 ק״ג', price: 210 },
  { id: 'bitumen-membrane', name: 'יריעה ביטומנית 4 מ״מ', category: 'sealing', description: 'יריעה משופרת לאיטום גגות ויסודות', unit: 'גליל 10 מ״ר', price: 190 },
  { id: 'silicone-clear', name: 'סיליקון שקוף לחדרי רטובים', category: 'sealing', description: 'עמיד לעובש, לאמבטיות ומקלחונים', unit: 'שפופרת 280 מ״ל', price: 22 },
  { id: 'pu-foam', name: 'פוליאוריטן מוקצף', category: 'sealing', description: 'למילוי חללים ואיטום סביב משקופים', unit: 'מיכל 750 מ״ל', price: 35 },

  // Tools
  { id: 'wheelbarrow', name: 'מריצה 90 ליטר', category: 'tools', description: 'מריצה מחוזקת עם גלגל אוויר', unit: 'יחידה', price: 280 },
  { id: 'roller-25', name: 'רולר צבע 25 ס״מ + ידית', category: 'tools', description: 'רולר לקירות ותקרות', unit: 'יחידה', price: 35 },
  { id: 'brush-3in', name: 'מברשת צבע 3 אינץ׳', category: 'tools', description: 'מברשת סיבים לצבעים על בסיס מים', unit: 'יחידה', price: 18 },
  { id: 'level-60', name: 'פלס אלומיניום 60 ס״מ', category: 'tools', description: 'פלס מדויק עם 3 בועות', unit: 'יחידה', price: 45 },
  { id: 'trowel', name: 'כף בנאים', category: 'tools', description: 'כף פלדה עם ידית עץ', unit: 'יחידה', price: 25 },
];

export const productsById = new Map(products.map((p) => [p.id, p]));

export function getCategory(id: CategoryId) {
  return categories.find((c) => c.id === id)!;
}

const priceFormat = new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function formatPrice(value: number) {
  return priceFormat.format(value);
}
