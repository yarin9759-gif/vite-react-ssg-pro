import { FaWhatsapp } from 'react-icons/fa';
import { site, whatsappLink } from '@/data/site';

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink(`שלום ${site.owner}, אשמח לקבל פרטים`)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`שליחת הודעת וואטסאפ ל${site.owner}`}
      className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-green-500 text-white shadow-lg flex items-center justify-center hover:bg-green-600 hover:scale-105 transition-all"
    >
      <FaWhatsapp className="w-8 h-8" />
    </a>
  );
}
