import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { PackageSearch, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProductCard from '@/components/ProductCard';
import { categories, products } from '@/data/products';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const activeCategory = categories.find((c) => c.id === searchParams.get('cat'));

  const term = query.trim();
  const visible = products.filter(
    (p) =>
      (!activeCategory || p.category === activeCategory.id) &&
      (!term || p.name.includes(term) || p.description.includes(term)),
  );

  const selectCategory = (id?: string) => setSearchParams(id ? { cat: id } : {}, { replace: true });

  const tabClass = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-400'
    }`;

  return (
    <div>
      <PageHeader
        title={activeCategory ? activeCategory.name : 'קטלוג המוצרים'}
        description={activeCategory ? activeCategory.description : 'חומרי בניין, צבעים, איטום ועוד'}
      />

      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
            <button onClick={() => selectCategory()} className={tabClass(!activeCategory)}>
              הכל
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => selectCategory(category.id)}
                className={tabClass(activeCategory?.id === category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <label className="relative lg:ms-auto lg:w-72">
            <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-5 h-5 text-stone-400" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש מוצר..."
              aria-label="חיפוש מוצר"
              className="w-full ps-10 pe-4 py-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </label>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-stone-500">
            <PackageSearch className="w-12 h-12 mx-auto mb-4" />
            <p>לא נמצאו מוצרים. נסו חיפוש אחר או צרו איתנו קשר — ייתכן שהמוצר זמין במלאי.</p>
          </div>
        )}
      </section>
    </div>
  );
}
