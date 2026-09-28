import { BadgeCheck, HardHat, Phone, Truck } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import PageHeader from '@/components/PageHeader';
import { site, whatsappLink } from '@/data/site';

const values = [
  { icon: HardHat, title: 'ניסיון מהשטח', text: 'אנחנו מכירים את העבודה באתר ויודעים להמליץ על הפתרון הנכון.' },
  { icon: BadgeCheck, title: 'איכות ואמינות', text: 'עובדים רק עם ספקים ומותגים שאנחנו סומכים עליהם.' },
  { icon: Truck, title: 'שירות עד הבית', text: 'משלוחים מהירים לאתרי בנייה, לקבלנים וללקוחות פרטיים.' },
];

export default function AboutPage() {
  return (
    <div>
      <PageHeader title={`אודות ${site.name}`} description={site.tagline} />

      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-4 text-lg text-stone-700 leading-relaxed">
            <p>
              {site.name} הוא מרכז לחומרי בניין, צבעים ומוצרי איטום, המשרת קבלנים, בעלי מקצוע ולקוחות פרטיים.
              אצלנו תמצאו את כל מה שצריך לפרויקט — מהיסודות ועד שכבת הצבע האחרונה.
            </p>
            <p>
              העסק בבעלות {site.owner}, שמלווה אישית כל לקוח — מבחירת החומרים וחישוב הכמויות ועד ניהול הפרויקט באתר.
            </p>
          </div>
          <img
            src="/images/site/about.webp"
            alt="בעל מקצוע בעבודה באתר בנייה"
            loading="lazy"
            width={1200}
            height={900}
            className="w-full rounded-2xl object-cover aspect-4/3 shadow-lg"
          />
        </div>

        <div className="mt-12 rounded-2xl bg-stone-900 text-white p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="w-16 h-16 shrink-0 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-2xl font-bold">
              {site.owner.charAt(0)}
            </span>
            <div>
              <p className="text-sm text-stone-400">הבעלים</p>
              <p className="text-2xl font-bold">{site.owner}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-amber-500 text-stone-900 font-bold hover:bg-amber-400 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span dir="ltr">{site.phone}</span>
            </a>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-green-600 font-bold hover:bg-green-700 transition-colors"
            >
              <FaWhatsapp className="w-5 h-5" />
              וואטסאפ
            </a>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mt-12">
          {values.map((value) => (
            <div key={value.title} className="bg-white rounded-xl border border-stone-200 p-6">
              <value.icon className="w-8 h-8 text-amber-600 mb-3" />
              <h2 className="font-bold text-stone-900 mb-2">{value.title}</h2>
              <p className="text-sm text-stone-600">{value.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
