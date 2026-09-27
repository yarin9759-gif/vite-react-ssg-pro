import { Link } from 'react-router';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { site, whatsappLink } from '@/data/site';
import { categories } from '@/data/products';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-20">
      <div className="container mx-auto px-4 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-bold text-white mb-3">{site.name}</p>
          <p className="text-sm leading-relaxed">
            {site.tagline}. ייעוץ מקצועי, מחירים הוגנים ומשלוחים לאתרי בנייה ולבתים פרטיים.
          </p>
        </div>

        <div>
          <p className="font-bold text-white mb-3">קטגוריות</p>
          <ul className="space-y-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link to={`/products?cat=${category.id}`} className="hover:text-amber-400">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-bold text-white mb-3">יצירת קשר</p>
          <ul className="space-y-3 text-sm">
            <li>
              <a href={`tel:${site.phone}`} className="flex items-center gap-2 hover:text-amber-400">
                <Phone className="w-4 h-4 shrink-0" />
                <span dir="ltr">{site.phone}</span>
              </a>
            </li>
            <li>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-amber-400">
                <FaWhatsapp className="w-4 h-4 shrink-0" />
                וואטסאפ
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-amber-400">
                <Mail className="w-4 h-4 shrink-0" />
                {site.email}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              {site.address}
            </li>
          </ul>
        </div>

        <div>
          <p className="font-bold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            שעות פעילות
          </p>
          <ul className="space-y-2 text-sm">
            {site.hours.map((row) => (
              <li key={row.days} className="flex justify-between gap-4 max-w-60">
                <span>{row.days}</span>
                <span dir="ltr">{row.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        © {new Date().getFullYear()} {site.name}. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
