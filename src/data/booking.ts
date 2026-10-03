// Consultation services offered in the booking flow.
// Shared by the site (src/) and the API (functions/), so keep this file free of browser-only imports.
//
// `durationMinutes` (null = not shown) should match the slot length set in the admin area.
export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number | null;
  // Price in ILS including VAT. 0 = free ("ללא עלות"), null = not shown
  price: number | null;
}

export const services: Service[] = [
  {
    id: 'project-consultation',
    name: 'ייעוץ וניהול פרויקט',
    description: 'אפיון הפרויקט, תכנון ראשוני ובניית לוח זמנים',
    durationMinutes: 90,
    // Same as the 'project-consultation' product in src/data/products.ts (checked by tests/)
    price: 750,
  },
  {
    id: 'villa-consultation',
    name: 'ייעוץ לפרויקט וילה',
    description: 'בחירת חומרי בנייה, גמר, צבע ואיטום בהתאם לתוכניות',
    durationMinutes: 90,
    price: 500,
  },
  {
    id: 'materials-consultation',
    name: 'ייעוץ חומרי בניין, צבע ואיטום',
    description: 'התאמת חומרים לעבודה, הערכת כמויות והמלצות לביצוע',
    durationMinutes: 90,
    price: 400,
  },
];

export const servicesById = new Map(services.map((s) => [s.id, s]));

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'proposed' | 'cancelled';

export const statusLabels: Record<BookingStatus, string> = {
  pending: 'ממתינה לאישור',
  approved: 'מאושרת',
  rejected: 'נדחתה',
  proposed: 'הוצע מועד חלופי',
  cancelled: 'בוטלה',
};
