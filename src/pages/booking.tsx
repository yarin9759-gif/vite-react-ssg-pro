import { useCallback, useEffect, useRef, useState, type SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock, Loader2, Phone, RefreshCw } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import Field from '@/components/booking/Field';
import { services, servicesById } from '@/data/booking';
import { formatPrice } from '@/data/products';
import { site, whatsappLink } from '@/data/site';
import { api, ApiError, errorMessage } from '@/lib/api';
import {
  formatDate,
  formatMonthShort,
  formatWeekdayShort,
  LIMITS,
  validateBookingInput,
  type BookingErrors,
  type BookingInput,
  type DaySlots,
} from '@/lib/booking-time';
import { describedBy, inputClass } from '@/lib/form';
import { saveBooking, statusPath } from '@/lib/my-bookings';

const steps = ['סוג הפגישה', 'מועד', 'פרטים', 'אישור'] as const;

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; days: DaySlots[] };

const emptyInput: BookingInput = { serviceId: '', date: '', time: '', name: '', phone: '', email: '', notes: '' };

export default function BookingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<BookingInput>(emptyInput);
  const [errors, setErrors] = useState<BookingErrors>({});
  const [availability, setAvailability] = useState<LoadState>({ status: 'loading' });
  const [notice, setNotice] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [startedAt] = useState(() => Date.now());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // State is only set once the request settles, so this is safe to call from an effect
  const fetchAvailability = useCallback(
    () =>
      api<{ days: DaySlots[] }>('/api/booking/availability').then(
        (data) => setAvailability({ status: 'ready', days: data.days }),
        (error) => setAvailability({ status: 'error', message: errorMessage(error) }),
      ),
    [],
  );

  const loadAvailability = () => {
    setAvailability({ status: 'loading' });
    fetchAvailability();
  };

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Move focus to the step title so screen readers announce the new step
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const update = (patch: Partial<BookingInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key as keyof BookingInput];
      return next;
    });
  };

  const days = availability.status === 'ready' ? availability.days : [];
  const selectedDay = days.find((d) => d.date === input.date);
  const service = servicesById.get(input.serviceId);

  function stepErrors(index: number): BookingErrors {
    const all = validateBookingInput(input, servicesById);
    const fields: (keyof BookingInput)[][] = [['serviceId'], ['date', 'time'], ['name', 'phone', 'email', 'notes'], []];
    return Object.fromEntries(fields[index].filter((f) => all[f]).map((f) => [f, all[f]]));
  }

  function next() {
    const found = stepErrors(step);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setNotice('');
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function back() {
    setSubmitError('');
    setStep((s) => Math.max(s - 1, 0));
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (step < steps.length - 1) {
      next();
      return;
    }
    const all = validateBookingInput(input, servicesById);
    if (Object.keys(all).length > 0) {
      setErrors(all);
      setStep(all.serviceId ? 0 : all.date || all.time ? 1 : 2);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await api<{ id: string; token: string }>('/api/booking/requests', {
        method: 'POST',
        body: { ...input, website: honeypot, startedAt },
      });
      saveBooking({ id: result.id, token: result.token, createdAt: new Date().toISOString() });
      navigate(statusPath(result.id, result.token), { state: { justCreated: true } });
    } catch (error) {
      setSubmitting(false);
      if (error instanceof ApiError && error.code === 'slot_unavailable') {
        update({ time: '' });
        setNotice(error.message);
        setStep(1);
        loadAvailability();
        return;
      }
      if (error instanceof ApiError && error.fields) {
        setErrors(error.fields as BookingErrors);
        setStep(2);
      }
      setSubmitError(errorMessage(error));
    }
  }

  return (
    <div className="bg-stone-50 min-h-[70vh]">
      <section className="bg-stone-900 text-white">
        <div className="container mx-auto px-4 pt-8 pb-6 max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-bold mb-1">קביעת פגישת ייעוץ</h1>
          <p className="text-stone-300">עם {site.owner} · {site.name}</p>
          <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="שלבי ההזמנה">
            {steps.map((label, i) => (
              <li key={label} aria-current={i === step ? 'step' : undefined}>
                <span className={`block h-1.5 rounded-full ${i <= step ? 'bg-amber-500' : 'bg-stone-700'}`} />
                <span className={`mt-2 block text-xs sm:text-sm ${i === step ? 'text-white font-bold' : 'text-stone-400'}`}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <form onSubmit={submit} noValidate className="container mx-auto px-4 py-6 max-w-2xl pb-32 md:pb-10">
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-stone-900 mb-4 focus:outline-none">
          שלב {step + 1} מתוך {steps.length}: {steps[step]}
        </h2>

        {notice && (
          <p role="alert" className="mb-4 rounded-lg bg-amber-50 border border-amber-300 p-4 text-amber-900">{notice}</p>
        )}

        {/* Honeypot: hidden from people and assistive tech, bots tend to fill it */}
        <div className="absolute w-px h-px overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
          <label htmlFor="website">אתר אינטרנט</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
        </div>

        {step === 0 && (
          <fieldset className="min-w-0">
            <legend className="sr-only">בחרו סוג פגישה</legend>
            <div className="grid gap-3" role="radiogroup" aria-describedby={errors.serviceId ? 'field-serviceId-error' : undefined}>
              {services.map((s, i) => {
                const selected = input.serviceId === s.id;
                return (
                  <label
                    key={s.id}
                    className={`relative flex gap-4 items-start rounded-xl border-2 bg-white p-4 cursor-pointer transition-colors ${
                      selected ? 'border-amber-500 shadow-sm' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="service"
                      id={i === 0 ? 'field-serviceId' : undefined}
                      value={s.id}
                      checked={selected}
                      onChange={() => update({ serviceId: s.id })}
                      className="mt-1 w-5 h-5 accent-amber-600 shrink-0"
                    />
                    <span className="flex-1">
                      <span className="block font-bold text-stone-900 text-lg">{s.name}</span>
                      <span className="block text-stone-600 text-sm mt-0.5">{s.description}</span>
                      {(s.durationMinutes || s.price !== null) && (
                        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-700">
                          {s.durationMinutes && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-4 h-4" aria-hidden="true" /> {s.durationMinutes} דקות
                            </span>
                          )}
                          {s.price !== null && <span className="font-bold">{s.price === 0 ? 'ללא עלות' : formatPrice(s.price)}</span>}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
            {errors.serviceId && <p id="field-serviceId-error" className="mt-2 text-sm font-medium text-red-700">{errors.serviceId}</p>}
          </fieldset>
        )}

        {step === 1 && (
          <div>
            {availability.status === 'loading' && (
              <p className="flex items-center gap-2 text-stone-600 py-8 justify-center" role="status">
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> טוען מועדים פנויים…
              </p>
            )}
            {availability.status === 'error' && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-5 text-red-900">
                <p className="font-medium mb-3">{availability.message}</p>
                <button type="button" onClick={loadAvailability} className="inline-flex items-center gap-2 font-bold text-red-800 underline">
                  <RefreshCw className="w-4 h-4" aria-hidden="true" /> נסו שוב
                </button>
              </div>
            )}
            {availability.status === 'ready' && days.length === 0 && <NoSlots />}
            {availability.status === 'ready' && days.length > 0 && (
              <>
                <fieldset className="min-w-0">
                  <legend className="flex items-center gap-2 font-bold text-stone-800 mb-3">
                    <CalendarDays className="w-5 h-5 text-amber-600" aria-hidden="true" /> בחרו יום
                  </legend>
                  <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 snap-x" role="radiogroup">
                    {days.map((day, i) => {
                      const selected = input.date === day.date;
                      return (
                        <label
                          key={day.date}
                          className={`relative snap-start shrink-0 w-20 rounded-xl border-2 py-3 text-center cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-amber-500 ${
                            selected ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="date"
                            id={i === 0 ? 'field-date' : undefined}
                            className="sr-only"
                            value={day.date}
                            checked={selected}
                            onChange={() => update({ date: day.date, time: '' })}
                            aria-label={formatDate(day.date)}
                          />
                          <span className="block text-sm text-stone-600">{formatWeekdayShort(day.date)}</span>
                          <span className="block text-2xl font-bold text-stone-900">{Number(day.date.slice(8))}</span>
                          <span className="block text-xs text-stone-500">{formatMonthShort(day.date)}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.date && <p className="mt-1 text-sm font-medium text-red-700">{errors.date}</p>}
                </fieldset>

                {selectedDay && (
                  <fieldset className="mt-6 min-w-0">
                    <legend className="flex items-center gap-2 font-bold text-stone-800 mb-3">
                      <Clock className="w-5 h-5 text-amber-600" aria-hidden="true" /> בחרו שעה · {formatDate(selectedDay.date)}
                    </legend>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="radiogroup">
                      {selectedDay.times.map((time, i) => {
                        const selected = input.time === time;
                        return (
                          <label
                            key={time}
                            className={`relative rounded-lg border-2 py-3 text-center font-bold cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-amber-500 ${
                              selected ? 'border-amber-500 bg-amber-500 text-stone-900' : 'border-stone-200 bg-white text-stone-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name="time"
                              id={i === 0 ? 'field-time' : undefined}
                              className="sr-only"
                              value={time}
                              checked={selected}
                              onChange={() => update({ time })}
                            />
                            <span dir="ltr">{time}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                )}
                {errors.time && input.date && <p className="mt-2 text-sm font-medium text-red-700">{errors.time}</p>}
                <p className="mt-4 text-sm text-stone-500">כל השעות לפי שעון ישראל.</p>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <Field id="field-name" label="שם מלא" error={errors.name}>
              <input
                id="field-name"
                className={inputClass(errors.name)}
                value={input.name}
                onChange={(e) => update({ name: e.target.value })}
                autoComplete="name"
                maxLength={LIMITS.name}
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={describedBy('field-name', errors.name)}
              />
            </Field>
            <Field id="field-phone" label="טלפון נייד" error={errors.phone} hint="נחזור אליכם למספר הזה">
              <input
                id="field-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                className={`${inputClass(errors.phone)} text-right`}
                value={input.phone}
                onChange={(e) => update({ phone: e.target.value })}
                autoComplete="tel"
                placeholder="050-1234567"
                required
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={describedBy('field-phone', errors.phone, 'נחזור אליכם למספר הזה')}
              />
            </Field>
            <Field id="field-email" label="אימייל" optional error={errors.email}>
              <input
                id="field-email"
                type="email"
                dir="ltr"
                className={`${inputClass(errors.email)} text-right`}
                value={input.email}
                onChange={(e) => update({ email: e.target.value })}
                autoComplete="email"
                maxLength={LIMITS.email}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={describedBy('field-email', errors.email)}
              />
            </Field>
            <Field
              id="field-notes"
              label="ספרו בקצרה על הפרויקט"
              optional
              error={errors.notes}
              hint="לדוגמה: סוג העבודה, מיקום, שלב הבנייה"
            >
              <textarea
                id="field-notes"
                rows={4}
                className={inputClass(errors.notes)}
                value={input.notes}
                onChange={(e) => update({ notes: e.target.value })}
                maxLength={LIMITS.notes}
                aria-invalid={Boolean(errors.notes)}
                aria-describedby={describedBy('field-notes', errors.notes, 'לדוגמה: סוג העבודה, מיקום, שלב הבנייה')}
              />
            </Field>
          </div>
        )}

        {step === 3 && service && (
          <div className="grid gap-4">
            <dl className="rounded-xl bg-white border border-stone-200 divide-y divide-stone-200">
              <SummaryRow
                label="סוג הפגישה"
                value={service.price === null ? service.name : `${service.name} · ${service.price === 0 ? 'ללא עלות' : formatPrice(service.price)}`}
                onEdit={() => setStep(0)}
              />
              <SummaryRow label="מועד" value={`${formatDate(input.date)}, ${input.time}`} onEdit={() => setStep(1)} />
              <SummaryRow label="שם" value={input.name} onEdit={() => setStep(2)} />
              <SummaryRow label="טלפון" value={input.phone} ltr onEdit={() => setStep(2)} />
              {input.email && <SummaryRow label="אימייל" value={input.email} ltr onEdit={() => setStep(2)} />}
              {input.notes && <SummaryRow label="פרטים" value={input.notes} onEdit={() => setStep(2)} />}
            </dl>
            <p className="rounded-lg bg-sky-50 border border-sky-200 p-4 text-sky-900">
              <strong>שימו לב:</strong> זו בקשה לפגישה. הפגישה תיקבע רק לאחר ש{site.owner} יאשר אותה, ותוכלו לבדוק את הסטטוס בכל רגע.
            </p>
          </div>
        )}

        {step === 0 && (
          <p className="mt-6 text-sm text-stone-600">
            כבר שלחתם בקשה? <Link to="/booking-status" className="font-medium text-amber-700 underline">לבדיקת הסטטוס</Link>
          </p>
        )}

        {submitError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 font-medium text-red-900">
            {submitError}
          </p>
        )}

        {/* Sticky action bar on mobile, inline on desktop */}
        <div className="fixed md:static inset-x-0 bottom-0 z-30 bg-white/95 md:bg-transparent backdrop-blur border-t md:border-0 border-stone-200 px-4 py-3 md:px-0 md:mt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-1 px-5 py-3.5 rounded-xl border border-stone-300 bg-white font-bold text-stone-800 hover:bg-stone-100 disabled:opacity-50"
              >
                <ArrowRight className="w-5 h-5" aria-hidden="true" /> חזרה
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || (step === 1 && availability.status !== 'ready')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-amber-500 font-bold text-stone-900 hover:bg-amber-400 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> שולח…
                </>
              ) : step === steps.length - 1 ? (
                <>
                  <Check className="w-5 h-5" aria-hidden="true" /> שליחת בקשה לפגישה
                </>
              ) : (
                <>
                  המשך <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}

function SummaryRow({ label, value, ltr, onEdit }: { label: string; value: string; ltr?: boolean; onEdit: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <dt className="text-sm text-stone-500">{label}</dt>
        <dd className="font-medium text-stone-900 break-words whitespace-pre-line" dir={ltr ? 'ltr' : undefined}>{value}</dd>
      </div>
      <button type="button" onClick={onEdit} className="shrink-0 text-sm font-medium text-amber-700 underline" aria-label={`עריכת ${label}`}>
        עריכה
      </button>
    </div>
  );
}

function NoSlots() {
  return (
    <div className="rounded-xl bg-white border border-stone-200 p-6 text-center">
      <p className="font-bold text-stone-900 mb-1">אין כרגע מועדים פנויים להזמנה באתר</p>
      <p className="text-stone-600 mb-5">אפשר לתאם ישירות מול {site.owner}:</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href={`tel:${site.phone}`} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white font-bold">
          <Phone className="w-5 h-5" aria-hidden="true" /> <span dir="ltr">{site.phone}</span>
        </a>
        <a
          href={whatsappLink(`שלום ${site.owner}, אשמח לתאם פגישת ייעוץ`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-bold"
        >
          <FaWhatsapp className="w-5 h-5" aria-hidden="true" /> וואטסאפ
        </a>
      </div>
    </div>
  );
}
