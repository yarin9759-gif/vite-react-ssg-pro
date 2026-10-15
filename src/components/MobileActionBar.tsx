import { Link } from 'react-router';
import { CalendarPlus, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { site, whatsappLink } from '@/data/site';

// Sticky call / WhatsApp / booking bar on small screens (replaces the floating WhatsApp button there).
export default function MobileActionBar() {
  const itemClass = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold';

  return (
    <nav
      aria-label="פעולות מהירות"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 flex bg-white/95 backdrop-blur border-t border-stone-200 pb-[env(safe-area-inset-bottom)]"
    >
      <a href={`tel:${site.phone}`} className={`${itemClass} text-stone-800`}>
        <Phone className="w-5 h-5" aria-hidden="true" />
        התקשרו
      </a>
      <a
        href={whatsappLink(`שלום ${site.owner}, אשמח לקבל פרטים`)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${itemClass} text-green-700`}
      >
        <FaWhatsapp className="w-5 h-5" aria-hidden="true" />
        וואטסאפ
      </a>
      <Link to="/booking" className={`${itemClass} bg-amber-500 text-stone-900`}>
        <CalendarPlus className="w-5 h-5" aria-hidden="true" />
        פגישת ייעוץ
      </Link>
    </nav>
  );
}
