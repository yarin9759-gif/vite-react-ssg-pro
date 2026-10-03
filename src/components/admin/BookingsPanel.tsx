import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CalendarClock, Check, Loader2, Mail, Phone, RefreshCw, X } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import StatusBadge from '@/components/booking/StatusBadge';
import { statusLabels, type BookingStatus } from '@/data/booking';
import { site } from '@/data/site';
import { api, ApiError, errorMessage, type AdminBooking } from '@/lib/api';
import { formatDate, phoneToWhatsapp } from '@/lib/booking-time';
import { inputClass } from '@/lib/form';

type Scope = 'upcoming' | 'past';
type Filter = BookingStatus | 'all';
type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; bookings: AdminBooking[] };

const filters: Filter[] = ['pending', 'proposed', 'approved', 'rejected', 'cancelled', 'all'];

// Ready-made WhatsApp text for the customer. Nothing is sent automatically - the link only opens a chat.
function customerMessage(b: AdminBooking): string {
  const when = `${formatDate(b.date)} בשעה ${b.time}`;
  const note = b.adminMessage ? `\n${b.adminMessage}` : '';
  switch (b.status) {
    case 'approved':
      return `שלום ${b.name}, פגישת ה${b.serviceName} שלך אושרה ל${when}. נתראה! ${site.owner}, ${site.name}${note}`;
    case 'rejected':
      return `שלום ${b.name}, לצערי לא אוכל לקיים את הפגישה שביקשת. אשמח לתאם מועד אחר. ${site.owner}, ${site.name}${note}`;
    case 'proposed':
      return `שלום ${b.name}, המועד שביקשת לא מתאים. אני מציע ${when}. אפשר לאשר בדף הסטטוס של הבקשה או להשיב כאן. ${site.owner}${note}`;
    default:
      return `שלום ${b.name}, כאן ${site.owner} מ${site.name}, לגבי בקשת הפגישה שלך ל${when}.`;
  }
}

export default function BookingsPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [scope, setScope] = useState<Scope>('upcoming');
  const [filter, setFilter] = useState<Filter>('pending');
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  // Bookings changed in this view stay visible after their status leaves the current filter,
  // so the follow-up WhatsApp link doesn't disappear
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) onUnauthorized();
      return errorMessage(error);
    },
    [onUnauthorized],
  );

  const fetchBookings = useCallback(
    (s: Scope) =>
      api<{ bookings: AdminBooking[] }>(`/api/admin/bookings?scope=${s}`).then(
        (data) => setState({ status: 'ready', bookings: data.bookings }),
        (error) => setState({ status: 'error', message: handleError(error) }),
      ),
    [handleError],
  );

  useEffect(() => {
    fetchBookings(scope);
  }, [scope, fetchBookings]);

  const reload = () => {
    setState({ status: 'loading' });
    fetchBookings(scope);
  };

  const replace = (updated: AdminBooking) => {
    setTouched((prev) => new Set(prev).add(updated.id));
    setState((prev) => (prev.status === 'ready' ? { status: 'ready', bookings: prev.bookings.map((b) => (b.id === updated.id ? updated : b)) } : prev));
  };

  const all = state.status === 'ready' ? state.bookings : [];
  const visible = filter === 'all' ? all : all.filter((b) => b.status === filter || touched.has(b.id));
  const count = (f: Filter) => (f === 'all' ? all.length : all.filter((b) => b.status === f).length);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5" role="group" aria-label="טווח">
          {(['upcoming', 'past'] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={scope === s}
              onClick={() => {
                setState({ status: 'loading' });
                setScope(s);
              }}
              className={`px-4 py-2 rounded-md text-sm font-bold ${scope === s ? 'bg-stone-900 text-white' : 'text-stone-700'}`}
            >
              {s === 'upcoming' ? 'קרובות' : 'עבר'}
            </button>
          ))}
        </div>
        <button type="button" onClick={reload} className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-amber-700">
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> רענון
        </button>
      </div>

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-3 mb-2" role="group" aria-label="סינון לפי סטטוס">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              setTouched(new Set());
            }}
            className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-bold border ${
              filter === f ? 'bg-amber-500 border-amber-500 text-stone-900' : 'bg-white border-stone-300 text-stone-700'
            }`}
          >
            {f === 'all' ? 'הכול' : statusLabels[f]} ({count(f)})
          </button>
        ))}
      </div>

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-stone-600 py-12 justify-center" role="status">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> טוען בקשות…
        </p>
      )}
      {state.status === 'error' && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 font-medium text-red-900">{state.message}</p>}
      {state.status === 'ready' && visible.length === 0 && <p className="text-center text-stone-500 py-12">אין בקשות להצגה</p>}

      <ul className="grid gap-4">
        {visible.map((b) => (
          <li key={b.id}>
            <BookingCard booking={b} onUpdated={replace} onError={handleError} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookingCard({
  booking: b,
  onUpdated,
  onError,
}: {
  booking: AdminBooking;
  onUpdated: (b: AdminBooking) => void;
  onError: (e: unknown) => string;
}) {
  const [mode, setMode] = useState<'idle' | 'propose'>('idle');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(b.date);
  const [time, setTime] = useState(b.time);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [justActed, setJustActed] = useState(false);

  const moved = b.date !== b.requestedDate || b.time !== b.requestedTime;
  const canApprove = b.status === 'pending' || b.status === 'proposed';
  const canReject = b.status === 'pending' || b.status === 'proposed' || b.status === 'approved';

  async function act(action: 'approve' | 'reject' | 'propose') {
    if (action === 'reject' && !window.confirm(`לדחות את הבקשה של ${b.name}?`)) return;
    setBusy(true);
    setError('');
    try {
      const body = action === 'propose' ? { action, date, time, message } : { action, message };
      const data = await api<{ booking: AdminBooking }>(`/api/admin/bookings/${encodeURIComponent(b.id)}`, { method: 'POST', body });
      onUpdated(data.booking);
      setMode('idle');
      setMessage('');
      setJustActed(true);
    } catch (e) {
      setError(onError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl bg-white border border-stone-200 p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <h3 className="text-lg font-bold text-stone-900">{b.name}</h3>
          <p className="text-stone-600">{b.serviceName}</p>
        </div>
        <StatusBadge status={b.status} />
      </div>

      <p className="font-bold text-stone-900">
        {formatDate(b.date)}, <span dir="ltr">{b.time}</span>
      </p>
      {moved && (
        <p className="text-sm text-stone-500">
          ביקש במקור: {formatDate(b.requestedDate)}, <span dir="ltr">{b.requestedTime}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm">
        <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 font-medium text-stone-800 hover:text-amber-700">
          <Phone className="w-4 h-4" aria-hidden="true" /> <span dir="ltr">{b.phone}</span>
        </a>
        {b.email && (
          <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 font-medium text-stone-800 hover:text-amber-700">
            <Mail className="w-4 h-4" aria-hidden="true" /> {b.email}
          </a>
        )}
      </div>
      {b.notes && <p className="mt-3 rounded-lg bg-stone-50 p-3 text-stone-700 whitespace-pre-line break-words">{b.notes}</p>}
      {b.adminMessage && <p className="mt-2 text-sm text-stone-500">ההודעה שלך ללקוח: {b.adminMessage}</p>}
      <p className="mt-2 text-xs text-stone-400">התקבלה {new Date(b.createdAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>

      {(canApprove || canReject) && (
        <div className="mt-4 border-t border-stone-200 pt-4 grid gap-3">
          {mode === 'propose' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-stone-700">
                תאריך חלופי
                <input type="date" className={`${inputClass()} mt-1`} value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="text-sm font-medium text-stone-700">
                שעה
                <input type="time" step={300} className={`${inputClass()} mt-1`} value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
            </div>
          )}
          <label className="text-sm font-medium text-stone-700">
            הודעה ללקוח (לא חובה, תוצג בדף הסטטוס שלו)
            <textarea rows={2} maxLength={500} className={`${inputClass()} mt-1`} value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          {error && <p role="alert" className="text-sm font-medium text-red-700">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {mode === 'propose' ? (
              <>
                <ActionButton onClick={() => act('propose')} busy={busy} className="bg-sky-600 text-white hover:bg-sky-700">
                  <CalendarClock className="w-4 h-4" aria-hidden="true" /> שליחת הצעה
                </ActionButton>
                <ActionButton onClick={() => setMode('idle')} busy={busy} className="border border-stone-300 text-stone-700 hover:bg-stone-100">
                  ביטול
                </ActionButton>
              </>
            ) : (
              <>
                {canApprove && (
                  <ActionButton onClick={() => act('approve')} busy={busy} className="bg-green-600 text-white hover:bg-green-700">
                    <Check className="w-4 h-4" aria-hidden="true" /> אישור
                  </ActionButton>
                )}
                <ActionButton onClick={() => setMode('propose')} busy={busy} className="bg-sky-100 text-sky-900 hover:bg-sky-200">
                  <CalendarClock className="w-4 h-4" aria-hidden="true" /> הצעת מועד אחר
                </ActionButton>
                {canReject && (
                  <ActionButton onClick={() => act('reject')} busy={busy} className="bg-red-50 text-red-800 hover:bg-red-100">
                    <X className="w-4 h-4" aria-hidden="true" /> {b.status === 'approved' ? 'ביטול פגישה' : 'דחייה'}
                  </ActionButton>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className={`mt-4 ${justActed ? 'rounded-lg bg-green-50 border border-green-200 p-3' : ''}`}>
        {justActed && <p className="text-sm text-green-900 mb-2" role="status">הסטטוס עודכן והלקוח יראה אותו בדף הסטטוס. רוצה לעדכן אותו גם בוואטסאפ?</p>}
        <a
          href={`https://wa.me/${phoneToWhatsapp(b.phone)}?text=${encodeURIComponent(customerMessage(b))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-bold text-green-700 hover:text-green-800"
        >
          <FaWhatsapp className="w-5 h-5" aria-hidden="true" /> פתיחת וואטסאפ עם הודעה מוכנה ל{b.name}
        </a>
      </div>
    </article>
  );
}

function ActionButton({ onClick, busy, className, children }: { onClick: () => void; busy: boolean; className: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm disabled:opacity-60 ${className}`}>
      {children}
    </button>
  );
}
