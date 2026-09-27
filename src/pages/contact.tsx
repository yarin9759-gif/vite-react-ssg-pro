import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import PageHeader from '@/components/PageHeader';
import { site, whatsappLink } from '@/data/site';

export default function ContactPage() {
  const channels = [
    { icon: Phone, label: 'טלפון', value: site.phone, href: `tel:${site.phone}`, ltr: true },
    { icon: FaWhatsapp, label: 'וואטסאפ', value: 'שלחו הודעה', href: whatsappLink() },
    { icon: Mail, label: 'אימייל', value: site.email, href: `mailto:${site.email}` },
    { icon: MapPin, label: 'כתובת', value: site.address },
  ];

  return (
    <div>
      <PageHeader title="צור קשר" description="שאלה, הצעת מחיר או ייעוץ — נשמח לעזור." />

      <section className="container mx-auto px-4 py-12 grid gap-8 lg:grid-cols-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {channels.map((channel) => {
            const content = (
              <>
                <channel.icon className="w-6 h-6 text-amber-600 mb-3" />
                <p className="text-sm text-stone-500">{channel.label}</p>
                <p className="font-bold text-stone-900" dir={channel.ltr ? 'ltr' : undefined}>
                  {channel.value}
                </p>
              </>
            );
            const cardClass = 'block bg-white rounded-xl border border-stone-200 p-6';
            return channel.href ? (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.href.startsWith('http') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className={`${cardClass} hover:border-amber-400 transition-colors`}
              >
                {content}
              </a>
            ) : (
              <div key={channel.label} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-stone-900 mb-4">
            <Clock className="w-5 h-5 text-amber-600" />
            שעות פעילות
          </h2>
          <ul className="divide-y divide-stone-200">
            {site.hours.map((row) => (
              <li key={row.days} className="flex justify-between py-3">
                <span>{row.days}</span>
                <span dir="ltr" className="font-medium">{row.time}</span>
              </li>
            ))}
            <li className="flex justify-between py-3 text-stone-500">
              <span>שבת</span>
              <span>סגור</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
