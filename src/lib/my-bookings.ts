// Remembers this device's booking requests (id + private token) so the visitor can find
// their status page again. Convenience only - the bookings themselves live in the database.
export interface SavedBooking {
  id: string;
  token: string;
  createdAt: string;
}

const STORAGE_KEY = 'my-bookings';
const MAX_SAVED = 10;

export function loadSavedBookings(): SavedBooking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as SavedBooking[]).filter((b) => b?.id && b?.token) : [];
  } catch {
    return [];
  }
}

export function saveBooking(entry: SavedBooking) {
  try {
    const list = [entry, ...loadSavedBookings().filter((b) => b.id !== entry.id)].slice(0, MAX_SAVED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode) - the status link still works
  }
}

export function statusPath(id: string, token: string) {
  return `/booking-status?id=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
}
