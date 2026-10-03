import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { CalendarCheck, CalendarClock, CalendarX, Copy, Hourglass, Loader2, Phone, RefreshCw } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import StatusBadge from '@/components/booking/StatusBadge';
import type { BookingStatus } from '@/data/booking';
import { site, whatsappLink } from '@/data/site';
import { api, errorMessage, type PublicBooking } from '@/lib/api';
import { formatDate } from '@/lib/booking-time';
import { loadSavedBookings, statusPath, type SavedBooking } from '@/lib/my-bookings';

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; booking: PublicBooking };

const explanations: Record<BookingStatus, { icon: typeof Hourglass; title: string; text: string; tone: string }> = {
  pending: {
    icon: Hourglass,
    title: 'הבקשה התקבלה וממתינה לאישור',
    text: `הפגישה עדיין לא מאושרת. ${site.owner} יעבור על הבקשה ויעדכן כאן. שמרו את הקישור לדף הזה כדי לבדוק את הסטטוס.`,
    tone: 'bg-amber-50 border-amber-300 text-amber-900',
  },
  approved: {
    icon: CalendarCheck,
    title: 'הפגישה אושרה',
    text: 'נתראה במועד שנקבע. אם משהו משתנה, עדכנו אותנו מראש.',
    tone: 'bg-green-50 border-green-300 text-green-900',
  },
  proposed: {
    icon: CalendarClock,
    title: 'הוצע לכם מועד חלופי',
    text: 'המועד שביקשתם לא מתאים, ובמקומו הוצע המועד שמופיע למטה. אשרו אותו או עדכנו שאינו מתאים.',
    tone: 'bg-sky-50 border-sky-300 text-sky-900',
  },
  rejected: {
    icon: CalendarX,
    title: 'הבקשה לא אושרה',
    text: 'לא ניתן לקיים את הפגישה במועד הזה. אפשר לבחור מועד אחר או ליצור קשר ישירות.',
    tone: 'bg-red-50 border-red-300 text-red-900',
  },
  cancelled: {
    icon: CalendarX,
    title: 'הבקשה בוטלה',
    text: 'אפשר לקבוע פגישה חדשה בכל עת.',
    tone: 'bg-stone-100 border-stone-300 text-stone-800',
  },
};

export default function BookingStatusPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const id = params.get('id') ?? '';
  const token = params.get('t') ?? '';
  const justCreated = Boolean((location.state as { justCreated?: boolean } | null)?.justCreated);

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = useCallback(
    () =>
      api<{ booking: PublicBooking }>(`/api/booking/status?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`).then(
        (data) => setState({ status: 'ready', booking: data.booking }),
        (error) => setState({ status: 'error', message: errorMessage(error) }),
      ),
    [id, token],
  );

  useEffect(() => {
    if (id && token) fetchStatus();
  }, [id, token, fetchStatus]);

  if (!id || !token) return <SavedRequests />;

  const refresh = () => {
    setState({ status: 'loading' });
    setActionError('');
    fetchStatus();
  };

  async function respond(action: 'accept' | 'decline' | 'cancel') {
    if (action !== 'accept' && !window.confirm(action === 'cancel' ? 'לבטל את הבקשה?' : 'לדחות את המועד המוצע? הבקשה תבוטל.')) return;
    setBusy(true);
    setActionError('');
    try {
      const data = await api<{ booking: PublicBooking }>('/api/booking/status', { method: 'POST', body: { id, token, action } });
      setState({ status: 'ready', booking: data.booking });
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      window.prompt('העתיקו את הקישור:', window.location.href);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[60vh]">
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-6">סטטוס בקשה לפגישה</h1>

      {state.status === 'loading' && (
        <p className="flex items-center gap-2 text-stone-600 py-8 justify-center" role="status">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> טוען…
        </p>
      )}

      {state.status === 'error' && (
        <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-5 text-red-900">
          <p className="font-medium mb-3">{state.message}</p>
          <button type="button" onClick={refresh} className="inline-flex items-center gap-2 font-bold underline">
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> נסו שוב
          </button>
        </div>
      )}

      {state.status === 'ready' && (() => {
        const b = state.booking;
        const info = explanations[b.status];
        const moved = b.date !== b.requestedDate || b.time !== b.requestedTime;
        const whatsappText = `שלום ${site.owner}, זה ${b.name}. לגבי בקשת הפגישה (${b.serviceName}) ל${formatDate(b.date)} בשעה ${b.time}.`;
        return (
          <div className="grid gap-4">
            {justCreated && b.status === 'pending' && (
              <p className="rounded-lg bg-green-50 border border-green-300 p-4 font-medium text-green-900" role="status">
                הבקשה נשמרה בהצלחה.
              </p>
            )}

            <section className={`rounded-xl border-2 p-5 ${info.tone}`} aria-live="polite">
              <div className="flex items-start gap-3">
                <info.icon className="w-7 h-7 shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="text-xl font-bold mb-1">{info.title}</h2>
                  <p>{info.text}</p>
                </div>
              </div>
            </section>

            <dl className="rounded-xl bg-white border border-stone-200 divide-y divide-stone-200">
              <Row label="סטטוס"><StatusBadge status={b.status} /></Row>
              <Row label="סוג הפגישה">{b.serviceName}</Row>
              <Row label={b.status === 'proposed' ? 'המועד המוצע' : 'מועד'}>
                <span className="font-bold">{formatDate(b.date)}, <span dir="ltr">{b.time}</span></span>
              </Row>
              {moved && (
                <Row label="המועד שביקשתם">
                  <span className="text-stone-500 line-through">{formatDate(b.requestedDate)}, <span dir="ltr">{b.requestedTime}</span></span>
                </Row>
              )}
              {b.adminMessage && <Row label={`הודעה מ${site.owner}`}><span className="whitespace-pre-line">{b.adminMessage}</span></Row>}
            </dl>

            {actionError && <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 font-medium text-red-900">{actionError}</p>}

            {b.status === 'proposed' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <button type="button" disabled={busy} onClick={() => respond('accept')} className="py-3.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 disabled:opacity-60">
                  המועד מתאים לי
                </button>
                <button type="button" disabled={busy} onClick={() => respond('decline')} className="py-3.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-60">
                  המועד לא מתאים
                </button>
              </div>
            )}

            {(b.status === 'rejected' || b.status === 'cancelled') && (
              <Link to="/booking" className="py-3.5 rounded-xl bg-amber-500 text-center font-bold text-stone-900 hover:bg-amber-400">
                קביעת פגישה חדשה
              </Link>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href={whatsappLink(whatsappText)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700"
              >
                <FaWhatsapp className="w-5 h-5" aria-hidden="true" /> הודעה ל{site.owner} בוואטסאפ
              </a>
              <a href={`tel:${site.phone}`} className="inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800">
                <Phone className="w-5 h-5" aria-hidden="true" /> <span dir="ltr">{site.phone}</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
              <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 font-medium text-amber-700 underline">
                <Copy className="w-4 h-4" aria-hidden="true" /> {copied ? 'הקישור הועתק' : 'העתקת הקישור לדף הזה'}
              </button>
              <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 font-medium text-amber-700 underline">
                <RefreshCw className="w-4 h-4" aria-hidden="true" /> רענון סטטוס
              </button>
              {(b.status === 'pending' || b.status === 'approved') && (
                <button type="button" disabled={busy} onClick={() => respond('cancel')} className="font-medium text-red-700 underline disabled:opacity-60">
                  ביטול הבקשה
                </button>
              )}
            </div>
            <p className="text-sm text-stone-500">
              העדכונים מופיעים בדף הזה. הודעות וואטסאפ לא נשלחות אוטומטית — הכפתור רק פותח שיחה.
            </p>
          </div>
        );
      })()}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <dt className="text-stone-500 shrink-0">{label}</dt>
      <dd className="text-stone-900 text-left">{children}</dd>
    </div>
  );
}

// Without a link: list the requests made from this device
function SavedRequests() {
  const [saved, setSaved] = useState<SavedBooking[]>([]);
  useEffect(() => {
    // localStorage is only available in the browser, not during prerendering
    queueMicrotask(() => setSaved(loadSavedBookings()));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[60vh]">
      <h1 className="text-2xl md:text-3xl font-bold text-stone-900 mb-4">סטטוס בקשה לפגישה</h1>
      {saved.length > 0 ? (
        <>
          <p className="text-stone-600 mb-4">בקשות שנשלחו מהמכשיר הזה:</p>
          <ul className="grid gap-3 mb-6">
            {saved.map((b) => (
              <li key={b.id}>
                <Link to={statusPath(b.id, b.token)} className="block rounded-xl bg-white border border-stone-200 p-4 font-medium hover:border-amber-400">
                  בקשה מ־{new Date(b.createdAt).toLocaleDateString('he-IL')}
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-stone-600 mb-6">
          כדי לראות סטטוס, פתחו את הקישור שקיבלתם אחרי שליחת הבקשה. אם הוא לא שמור אצלכם, צרו קשר ונבדוק עבורכם.
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/booking" className="py-3.5 px-6 rounded-xl bg-amber-500 text-center font-bold text-stone-900 hover:bg-amber-400">
          קביעת פגישה
        </Link>
        <a
          href={whatsappLink(`שלום ${site.owner}, אשמח לבדוק את סטטוס הבקשה שלי לפגישה`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-green-600 text-white font-bold"
        >
          <FaWhatsapp className="w-5 h-5" aria-hidden="true" /> וואטסאפ
        </a>
      </div>
    </div>
  );
}
