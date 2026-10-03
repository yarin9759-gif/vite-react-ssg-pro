import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { FaPaypal, FaWhatsapp } from 'react-icons/fa';
import PageHeader from '@/components/PageHeader';
import { QuantityStepper } from '@/components/ProductCard';
import { formatPrice, getCategory, productsById } from '@/data/products';
import { paypalLink, site, whatsappLink } from '@/data/site';
import { clearCart, setQuantity, useCart } from '@/cart';

const inputClass =
  'w-full px-4 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500';

export default function CartPage() {
  const cart = useCart();
  const [delivery, setDelivery] = useState<'delivery' | 'pickup'>('delivery');

  const lines = Object.entries(cart).flatMap(([id, quantity]) => {
    const product = productsById.get(id);
    return product ? [{ product, quantity }] : [];
  });
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  const sendOrder = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const message = [
      'שלום, אני מעוניין/ת להזמין:',
      '',
      ...lines.map((l) => `• ${l.product.name} (${l.product.unit}) × ${l.quantity}`),
      '',
      `סה״כ משוער: ${formatPrice(total)}`,
      '',
      `שם: ${form.get('name')}`,
      `טלפון: ${form.get('phone')}`,
      delivery === 'delivery' ? `משלוח לכתובת: ${form.get('address')}` : 'איסוף עצמי',
      form.get('notes') ? `הערות: ${form.get('notes')}` : '',
    ]
      .filter((line, i, all) => line !== '' || all[i - 1] !== '')
      .join('\n');

    // The PayPal button submits the same form so the customer's details are validated first
    const payWithPaypal = (e.nativeEvent.submitter as HTMLElement | null)?.dataset.action === 'paypal';
    const url = payWithPaypal ? paypalLink(total, `הזמנה מ${site.name} – ${form.get('name')}`) : whatsappLink(message);
    window.open(url, '_blank', 'noopener');
  };

  if (lines.length === 0) {
    return (
      <div>
        <PageHeader title="סל הקניות" />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingCart className="w-14 h-14 mx-auto mb-4 text-stone-400" />
          <p className="text-lg text-stone-600 mb-6">הסל ריק כרגע.</p>
          <Link to="/products" className="inline-block px-7 py-3 rounded-lg bg-amber-500 text-stone-900 font-bold hover:bg-amber-400">
            לקטלוג המוצרים
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="סל הקניות" />

      <div className="container mx-auto px-4 py-8 grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        <section className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-200">
          {lines.map(({ product, quantity }) => {
            const category = getCategory(product.category);
            return (
              <div key={product.id} className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4">
                <span className={`w-14 h-14 shrink-0 rounded-lg flex items-center justify-center ${category.tint}`}>
                  <category.icon className="w-7 h-7" />
                </span>
                <div className="flex-1 min-w-40">
                  <p className="font-bold text-stone-900">{product.name}</p>
                  <p className="text-sm text-stone-500">
                    {product.unit} · {formatPrice(product.price)}
                  </p>
                </div>
                <div className="w-36">
                  <QuantityStepper id={product.id} quantity={quantity} />
                </div>
                <p className="w-24 text-end font-bold">{formatPrice(product.price * quantity)}</p>
                <button
                  onClick={() => setQuantity(product.id, 0)}
                  className="p-2 text-stone-400 hover:text-red-600"
                  aria-label={`הסרת ${product.name}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          <div className="flex items-center justify-between p-4">
            <button onClick={clearCart} className="text-sm text-stone-500 hover:text-red-600">
              ריקון הסל
            </button>
            <p className="text-lg">
              סה״כ: <span className="font-bold text-2xl">{formatPrice(total)}</span>
            </p>
          </div>
        </section>

        <form onSubmit={sendOrder} className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 lg:sticky lg:top-24">
          <h2 className="text-xl font-bold text-stone-900">פרטי ההזמנה</h2>
          <input name="name" required placeholder="שם מלא" autoComplete="name" className={inputClass} />
          <input name="phone" required type="tel" placeholder="טלפון" autoComplete="tel" className={inputClass} />

          <fieldset className="grid grid-cols-2 gap-2">
            <legend className="sr-only">אופן קבלה</legend>
            {([['delivery', 'משלוח'], ['pickup', 'איסוף עצמי']] as const).map(([value, label]) => (
              <label
                key={value}
                className={`text-center py-2.5 rounded-lg border cursor-pointer font-medium ${
                  delivery === value ? 'border-amber-500 bg-amber-50 text-amber-800' : 'border-stone-300'
                }`}
              >
                <input
                  type="radio"
                  name="delivery"
                  value={value}
                  checked={delivery === value}
                  onChange={() => setDelivery(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </fieldset>

          {delivery === 'delivery' && (
            <input name="address" required placeholder="כתובת למשלוח" autoComplete="street-address" className={inputClass} />
          )}
          <textarea name="notes" rows={3} placeholder="הערות (לא חובה)" className={inputClass} />

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
          >
            <FaWhatsapp className="w-5 h-5" />
            שליחת ההזמנה בוואטסאפ
          </button>
          {site.paypalEnabled && (
            <button
              type="submit"
              data-action="paypal"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-[#0070ba] text-white font-bold hover:bg-[#005ea6] transition-colors"
            >
              <FaPaypal className="w-5 h-5" />
              תשלום ב-PayPal ({formatPrice(total)})
            </button>
          )}
          <p className="text-xs text-stone-500 leading-relaxed">
            המחירים כוללים מע״מ ואינם כוללים דמי משלוח. נציג יחזור אליכם לאישור ההזמנה, זמינות המלאי ותיאום אספקה.
          </p>
        </form>
      </div>
    </div>
  );
}
