import { Minus, Plus, ShoppingCart } from 'lucide-react';
import { formatPrice, getCategory, type Product } from '@/data/products';
import { setQuantity, useCart } from '@/cart';

export default function ProductCard({ product }: { product: Product }) {
  const cart = useCart();
  const quantity = cart[product.id] ?? 0;
  const category = getCategory(product.category);

  return (
    <article className="flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={product.image ?? category.image}
        alt={product.name}
        loading="lazy"
        width={800}
        height={600}
        className="aspect-4/3 w-full object-cover"
      />

      <div className="flex flex-col flex-1 p-4">
        <p className="text-xs font-medium text-stone-500 mb-1">{category.name}</p>
        <h3 className="font-bold text-stone-900 leading-snug mb-1">{product.name}</h3>
        <p className="text-sm text-stone-600 mb-3 flex-1">{product.description}</p>
        <div className="flex items-baseline justify-between mb-4">
          <span className="text-xl font-bold text-stone-900">{formatPrice(product.price)}</span>
          <span className="text-sm text-stone-500">{product.unit}</span>
        </div>

        {quantity === 0 ? (
          <button
            onClick={() => setQuantity(product.id, 1)}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-amber-500 text-stone-900 font-bold hover:bg-amber-400 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            הוספה לסל
          </button>
        ) : (
          <QuantityStepper id={product.id} quantity={quantity} />
        )}
      </div>
    </article>
  );
}

export function QuantityStepper({ id, quantity }: { id: string; quantity: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-stone-300 overflow-hidden">
      <button
        onClick={() => setQuantity(id, quantity + 1)}
        className="p-2.5 hover:bg-stone-100"
        aria-label="הוספת יחידה"
      >
        <Plus className="w-4 h-4" />
      </button>
      <input
        type="number"
        min={0}
        value={quantity}
        onChange={(e) => setQuantity(id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
        className="w-14 text-center font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="כמות"
      />
      <button
        onClick={() => setQuantity(id, quantity - 1)}
        className="p-2.5 hover:bg-stone-100"
        aria-label="הפחתת יחידה"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}
