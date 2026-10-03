import { useCallback, useEffect, useState, type SubmitEvent } from 'react';
import { CalendarCog, ClipboardList, Loader2, Lock, LogOut } from 'lucide-react';
import AvailabilityPanel from '@/components/admin/AvailabilityPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import Field from '@/components/booking/Field';
import { site } from '@/data/site';
import { api, errorMessage } from '@/lib/api';
import { describedBy, inputClass } from '@/lib/form';

type Session = { status: 'loading' } | { status: 'error'; message: string } | { status: 'out'; configError: string | null } | { status: 'in' };

const tabs = [
  { id: 'bookings', label: 'בקשות', icon: ClipboardList },
  { id: 'availability', label: 'זמינות', icon: CalendarCog },
] as const;

export default function AdminPage() {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('bookings');

  const checkSession = useCallback(
    () =>
      api<{ authenticated: boolean; configError: string | null }>('/api/admin/session').then(
        (data) => setSession(data.authenticated ? { status: 'in' } : { status: 'out', configError: data.configError }),
        (error) => setSession({ status: 'error', message: errorMessage(error) }),
      ),
    [],
  );

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const onUnauthorized = useCallback(() => setSession({ status: 'out', configError: null }), []);

  async function logout() {
    try {
      await api('/api/admin/session', { method: 'DELETE' });
    } catch {
      // The session cookie expires on its own; show the login screen either way
    }
    setSession({ status: 'out', configError: null });
  }

  if (session.status === 'loading') {
    return (
      <p className="flex items-center gap-2 text-stone-600 py-24 justify-center" role="status">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> טוען…
      </p>
    );
  }
  if (session.status === 'error') {
    return <p role="alert" className="container mx-auto px-4 py-24 max-w-md text-center text-red-800 font-medium">{session.message}</p>;
  }
  if (session.status === 'out') {
    return <Login configError={session.configError} onSuccess={() => setSession({ status: 'in' })} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-stone-900">ניהול פגישות</h1>
        <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-100 font-medium">
          <LogOut className="w-4 h-4" aria-hidden="true" /> יציאה
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-200 mb-6" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold ${
              tab === t.id ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-600'
            }`}
          >
            <t.icon className="w-5 h-5" aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'bookings' ? <BookingsPanel onUnauthorized={onUnauthorized} /> : <AvailabilityPanel onUnauthorized={onUnauthorized} />}
      </div>
    </div>
  );
}

function Login({ configError, onSuccess }: { configError: string | null; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!password) {
      setError('יש להזין סיסמה');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/login', { method: 'POST', body: { password } });
      onSuccess();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <span className="w-14 h-14 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-bold text-stone-900">כניסת מנהל</h1>
        <p className="text-stone-600">{site.name}</p>
      </div>
      {configError && (
        <p role="alert" className="mb-4 rounded-lg bg-amber-50 border border-amber-300 p-4 text-amber-900">
          {configError}. ראו docs/booking.md.
        </p>
      )}
      <form onSubmit={submit} noValidate className="grid gap-4">
        <Field id="admin-password" label="סיסמה" error={error}>
          <input
            id="admin-password"
            type="password"
            dir="ltr"
            autoComplete="current-password"
            className={inputClass(error)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy('admin-password', error)}
          />
        </Field>
        <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-60">
          {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />} כניסה
        </button>
      </form>
    </div>
  );
}
