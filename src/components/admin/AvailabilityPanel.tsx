import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { api, ApiError, errorMessage } from '@/lib/api';
import { formatDate, type AvailabilityRule, type BookingSettings } from '@/lib/booking-time';
import { inputClass } from '@/lib/form';

interface Availability {
  settings: BookingSettings;
  rules: AvailabilityRule[];
  blockedDates: { date: string; reason: string | null }[];
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' };

const weekdays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function AvailabilityPanel({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [data, setData] = useState<Availability | null>(null);
  const [newBlocked, setNewBlocked] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) onUnauthorized();
      return errorMessage(error);
    },
    [onUnauthorized],
  );

  useEffect(() => {
    api<Availability>('/api/admin/availability').then(
      (loaded) => {
        setData(loaded);
        setState({ status: 'ready' });
      },
      (error) => setState({ status: 'error', message: handleError(error) }),
    );
  }, [handleError]);

  if (state.status === 'loading') {
    return (
      <p className="flex items-center gap-2 text-stone-600 py-12 justify-center" role="status">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> טוען…
      </p>
    );
  }
  if (state.status === 'error' || !data) {
    return <p role="alert" className="rounded-lg bg-red-50 border border-red-200 p-4 font-medium text-red-900">{state.status === 'error' ? state.message : ''}</p>;
  }

  const change = (patch: Partial<Availability>) => {
    setData({ ...data, ...patch });
    setResult(null);
  };
  const setSetting = (key: keyof BookingSettings, value: string) => change({ settings: { ...data.settings, [key]: Number(value) } });
  const setRule = (index: number, patch: Partial<AvailabilityRule>) =>
    change({ rules: data.rules.map((r, i) => (i === index ? { ...r, ...patch } : r)) });

  function addBlocked() {
    if (!newBlocked.date) return;
    const others = data!.blockedDates.filter((b) => b.date !== newBlocked.date);
    change({ blockedDates: [...others, { date: newBlocked.date, reason: newBlocked.reason || null }].sort((a, b) => a.date.localeCompare(b.date)) });
    setNewBlocked({ date: '', reason: '' });
  }

  async function save() {
    setSaving(true);
    setResult(null);
    try {
      const saved = await api<Availability>('/api/admin/availability', {
        method: 'PUT',
        body: { settings: data!.settings, rules: data!.rules, blockedDates: data!.blockedDates },
      });
      setData(saved);
      setResult({ ok: true, message: 'השינויים נשמרו' });
    } catch (error) {
      setResult({ ok: false, message: handleError(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-24 md:pb-0">
      <section className="rounded-xl bg-white border border-stone-200 p-4 md:p-5">
        <h2 className="text-lg font-bold text-stone-900 mb-4">הגדרות כלליות</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <NumberField label="אורך משבצת (דקות)" value={data.settings.slotMinutes} min={15} max={240} step={5} onChange={(v) => setSetting('slotMinutes', v)} />
          <NumberField label="התראה מינימלית (שעות)" value={data.settings.minNoticeHours} min={0} max={168} onChange={(v) => setSetting('minNoticeHours', v)} />
          <NumberField label="אפשר להזמין עד (ימים קדימה)" value={data.settings.maxDaysAhead} min={1} max={180} onChange={(v) => setSetting('maxDaysAhead', v)} />
        </div>
      </section>

      <section className="rounded-xl bg-white border border-stone-200 p-4 md:p-5">
        <h2 className="text-lg font-bold text-stone-900 mb-1">שעות קבועות לפגישות</h2>
        <p className="text-sm text-stone-500 mb-4">לכל יום אפשר להוסיף כמה טווחים. יום בלי טווח – סגור להזמנות.</p>
        <div className="divide-y divide-stone-200">
          {weekdays.map((dayName, weekday) => {
            const ranges = data.rules.map((r, index) => ({ r, index })).filter(({ r }) => r.weekday === weekday);
            return (
              <div key={dayName} className="py-3 flex flex-col sm:flex-row sm:items-start gap-2">
                <p className="w-20 shrink-0 font-bold text-stone-800 pt-2">{dayName}</p>
                <div className="flex-1 min-w-0 grid grid-cols-1 gap-2">
                  {ranges.length === 0 && <p className="text-stone-400 pt-2">סגור</p>}
                  {ranges.map(({ r, index }) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="time" aria-label={`יום ${dayName}, משעה`} className={`${inputClass()} min-w-0 flex-1 px-2 py-2`} value={r.start} onChange={(e) => setRule(index, { start: e.target.value })} />
                      <span aria-hidden="true">–</span>
                      <input type="time" aria-label={`יום ${dayName}, עד שעה`} className={`${inputClass()} min-w-0 flex-1 px-2 py-2`} value={r.end} onChange={(e) => setRule(index, { end: e.target.value })} />
                      <button
                        type="button"
                        onClick={() => change({ rules: data.rules.filter((_, i) => i !== index) })}
                        className="shrink-0 p-2 rounded-lg text-red-700 hover:bg-red-50"
                        aria-label={`הסרת טווח ביום ${dayName}`}
                      >
                        <Trash2 className="w-5 h-5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => change({ rules: [...data.rules, { weekday, start: '09:00', end: '12:00' }] })}
                    className="justify-self-start inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" /> הוספת טווח
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl bg-white border border-stone-200 p-4 md:p-5">
        <h2 className="text-lg font-bold text-stone-900 mb-1">ימים חסומים</h2>
        <p className="text-sm text-stone-500 mb-4">חופשה, חג או יום עמוס – לא יוצעו בהם מועדים. בקשות שכבר קיימות לא נמחקות.</p>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input type="date" aria-label="תאריך לחסימה" className={inputClass()} value={newBlocked.date} onChange={(e) => setNewBlocked({ ...newBlocked, date: e.target.value })} />
          <input
            aria-label="סיבה (לא חובה)"
            placeholder="סיבה (לא חובה)"
            maxLength={100}
            className={inputClass()}
            value={newBlocked.reason}
            onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
          />
          <button type="button" onClick={addBlocked} disabled={!newBlocked.date} className="shrink-0 inline-flex items-center justify-center gap-1 px-4 py-3 rounded-lg bg-stone-900 text-white font-bold disabled:opacity-50">
            <Plus className="w-4 h-4" aria-hidden="true" /> חסימה
          </button>
        </div>
        {data.blockedDates.length === 0 ? (
          <p className="text-stone-400">אין ימים חסומים</p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {data.blockedDates.map((b) => (
              <li key={b.date} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="font-medium">{formatDate(b.date)}</span>
                  {b.reason && <span className="text-stone-500"> · {b.reason}</span>}
                </span>
                <button
                  type="button"
                  onClick={() => change({ blockedDates: data.blockedDates.filter((x) => x.date !== b.date) })}
                  className="p-2 rounded-lg text-red-700 hover:bg-red-50"
                  aria-label={`ביטול החסימה של ${formatDate(b.date)}`}
                >
                  <Trash2 className="w-5 h-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="fixed md:static inset-x-0 bottom-0 z-30 bg-white/95 md:bg-transparent backdrop-blur border-t md:border-0 border-stone-200 px-4 py-3 md:p-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button type="button" onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-60">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Save className="w-5 h-5" aria-hidden="true" />} שמירת שינויים
          </button>
          {result && (
            <p role={result.ok ? 'status' : 'alert'} className={`text-sm font-medium ${result.ok ? 'text-green-700' : 'text-red-700'}`}>
              {result.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: string) => void }) {
  return (
    <label className="text-sm font-medium text-stone-700">
      {label}
      <input type="number" inputMode="numeric" min={min} max={max} step={step} className={`${inputClass()} mt-1`} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
