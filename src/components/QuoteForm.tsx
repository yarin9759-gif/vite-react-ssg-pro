import { type SyntheticEvent, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import Field from '@/components/booking/Field';
import { categories } from '@/data/products';
import { site, whatsappLink } from '@/data/site';
import { describedBy, inputClass } from '@/lib/form';

// Quick quote request: builds a WhatsApp message from the form (no backend involved).
export default function QuoteForm() {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState<string>(categories[0].name);
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string>();

  function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!details.trim()) {
      setError('כתבו בקצרה מה אתם צריכים');
      return;
    }
    setError(undefined);
    const lines = [
      `שלום ${site.owner}, אשמח לקבל הצעת מחיר.`,
      name.trim() && `שם: ${name.trim()}`,
      `נושא: ${topic}`,
      `פירוט: ${details.trim()}`,
      location.trim() && `מיקום: ${location.trim()}`,
    ].filter(Boolean);
    window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener,noreferrer');
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <Field id="quote-name" label="שם" optional>
        <input id="quote-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={inputClass()} />
      </Field>
      <Field id="quote-topic" label="נושא">
        <select id="quote-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={inputClass()}>
          {categories.map((category) => (
            <option key={category.id}>{category.name}</option>
          ))}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field id="quote-details" label="מה צריך?" error={error} hint="לדוגמה: 40 שקי מלט ו־10 דליי צבע חוץ">
          <textarea
            id="quote-details"
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={describedBy('quote-details', error, 'hint')}
            className={inputClass(error)}
          />
        </Field>
      </div>
      <Field id="quote-location" label="עיר / אתר עבודה" optional>
        <input id="quote-location" value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass()} />
      </Field>
      <div className="flex items-end">
        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
        >
          <FaWhatsapp className="w-5 h-5" aria-hidden="true" />
          שליחת בקשה בוואטסאפ
        </button>
      </div>
    </form>
  );
}
