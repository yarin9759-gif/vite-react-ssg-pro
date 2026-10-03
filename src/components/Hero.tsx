import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { site, whatsappLink } from '@/data/site';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-stone-900 text-white">
      <img
        src="/images/site/hero.webp"
        alt=""
        width={1600}
        height={900}
        fetchPriority="high"
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-linear-to-l from-stone-950/95 via-stone-900/80 to-stone-900/40" aria-hidden="true" />

      <div className="relative container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="inline-block px-3 py-1 mb-6 rounded-full bg-amber-500/15 text-amber-400 text-sm font-medium">
            משלוחים לכל האזור · ייעוץ מקצועי
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 text-balance">
            כל מה שצריך לבנייה,
            <br />
            <span className="text-amber-400">צביעה ואיטום</span> — במקום אחד
          </h1>
          <p className="text-lg md:text-xl text-stone-300 mb-10 leading-relaxed">
            חומרי בניין, צבעים ומוצרי איטום של המותגים המובילים, במחירים הוגנים לקבלנים ולפרטיים.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg bg-amber-500 text-stone-900 font-bold hover:bg-amber-400 transition-colors"
            >
              לקטלוג המוצרים
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a
              href={whatsappLink('שלום, אשמח לקבל הצעת מחיר')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-stone-600 font-bold hover:bg-stone-800 transition-colors"
            >
              <FaWhatsapp className="w-5 h-5 text-green-400" />
              הצעת מחיר בוואטסאפ
            </a>
          </div>
          <p className="mt-8 text-stone-300">
            {site.owner} ·{' '}
            <a href={`tel:${site.phone}`} dir="ltr" className="font-bold text-white hover:text-amber-400">
              {site.phone}
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
