import { BadgeCheck, HardHat, Truck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { site } from '@/data/site';

const values = [
  { icon: HardHat, title: 'ניסיון מהשטח', text: 'אנחנו מכירים את העבודה באתר ויודעים להמליץ על הפתרון הנכון.' },
  { icon: BadgeCheck, title: 'איכות ואמינות', text: 'עובדים רק עם ספקים ומותגים שאנחנו סומכים עליהם.' },
  { icon: Truck, title: 'שירות עד הבית', text: 'משלוחים מהירים לאתרי בנייה, לקבלנים וללקוחות פרטיים.' },
];

export default function AboutPage() {
  return (
    <div>
      <PageHeader title={`אודות ${site.name}`} description={site.tagline} />

      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-4 text-lg text-stone-700 leading-relaxed">
          <p>
            {site.name} הוא מרכז לחומרי בניין, צבעים ומוצרי איטום, המשרת קבלנים, בעלי מקצוע ולקוחות פרטיים.
            אצלנו תמצאו את כל מה שצריך לפרויקט — מהיסודות ועד שכבת הצבע האחרונה.
          </p>
          <p>
            הצוות שלנו ישמח לייעץ בבחירת החומרים, לחשב כמויות ולהתאים פתרון לכל תקציב.
          </p>
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
