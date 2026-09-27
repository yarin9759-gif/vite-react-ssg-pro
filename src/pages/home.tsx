import { Link } from 'react-router';
import { ArrowLeft, BadgeCheck, Phone, ShieldCheck, Truck } from 'lucide-react';
import Hero from '@/components/Hero';
import ProductCard from '@/components/ProductCard';
import { categories, products } from '@/data/products';
import { site } from '@/data/site';

const benefits = [
  { icon: Truck, title: 'משלוחים מהירים', text: 'עד אתר הבנייה או עד הבית, כולל מנוף לפי הצורך' },
  { icon: BadgeCheck, title: 'ייעוץ מקצועי', text: 'צוות עם ניסיון בשטח שיעזור לבחור את החומר הנכון' },
  { icon: ShieldCheck, title: 'מותגים מובילים', text: 'מוצרים מאושרים בתקן ישראלי עם אחריות יצרן' },
];

// One highlighted product from each category
const featured = categories.flatMap((c) => products.filter((p) => p.category === c.id).slice(0, 1));

export default function Home() {
  return (
    <div>
      <Hero />

      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-8">קטגוריות</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?cat=${category.id}`}
              className="group bg-white rounded-xl border border-stone-200 p-5 hover:border-amber-400 hover:shadow-md transition-all"
            >
              <span className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${category.tint}`}>
                <category.icon className="w-6 h-6" />
              </span>
              <h3 className="font-bold text-lg text-stone-900 mb-1 group-hover:text-amber-600">{category.name}</h3>
              <p className="text-sm text-stone-600">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-white border-y border-stone-200">
        <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-4">
              <span className="w-12 h-12 shrink-0 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <benefit.icon className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-stone-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-stone-600">{benefit.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900">מוצרים מובילים</h2>
          <Link to="/products" className="flex items-center gap-1 font-medium text-amber-600 hover:text-amber-700">
            לכל המוצרים
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="rounded-2xl bg-amber-500 text-stone-900 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">קבלן? מתכננים פרויקט גדול?</h2>
            <p className="text-lg">דברו איתנו לקבלת הצעת מחיר מותאמת לכמויות.</p>
          </div>
          <a
            href={`tel:${site.phone}`}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-stone-900 text-white font-bold hover:bg-stone-800 transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span dir="ltr">{site.phone}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
