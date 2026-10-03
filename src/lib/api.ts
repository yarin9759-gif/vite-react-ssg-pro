import type { BookingStatus } from '@/data/booking';

// Small fetch wrapper for the booking API (functions/api). Every failure becomes an ApiError
// with a Hebrew message that is safe to show to the visitor.
export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;
  code?: string;

  constructor(message: string, status: number, fields?: Record<string, string>, code?: string) {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: options.method ?? 'GET',
      headers: options.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('אין חיבור לשרת. בדקו את החיבור לאינטרנט ונסו שוב.', 0);
  }

  let data: { error?: string; fields?: Record<string, string>; code?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    // Not JSON - e.g. the API isn't deployed or a proxy error page
  }

  if (!response.ok || !data) {
    const message = data?.error ?? (response.status === 404
      ? 'מערכת ההזמנות אינה זמינה כרגע.'
      : 'אירעה שגיאה. נסו שוב בעוד כמה דקות.');
    throw new ApiError(message, response.status, data?.fields, data?.code);
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'אירעה שגיאה לא צפויה. נסו שוב.';
}

// Response shapes (see functions/_lib/db.ts)
export interface PublicBooking {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  requestedDate: string;
  requestedTime: string;
  name: string;
  status: BookingStatus;
  adminMessage: string | null;
  createdAt: string;
}

export interface AdminBooking extends PublicBooking {
  phone: string;
  email: string | null;
  notes: string | null;
  updatedAt: string;
}
