import { Link, NavLink } from 'react-router';
import { useState } from 'react';
import { HardHat, Menu, Phone, ShoppingCart, X } from 'lucide-react';
import { site } from '@/data/site';
import { useCart } from '@/cart';

const navLinks = [
  { name: 'דף הבית', href: '/' },
  { name: 'מוצרים', href: '/products' },
  { name: 'אודות', href: '/about' },
  { name: 'צור קשר', href: '/contact' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-medium transition-colors ${isActive ? 'text-amber-600' : 'text-stone-700 hover:text-amber-600'}`;

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cart = useCart();
  const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <span className="w-9 h-9 rounded-lg bg-amber-500 text-stone-900 flex items-center justify-center">
            <HardHat className="w-5 h-5" />
          </span>
          <span className="text-xl font-bold text-stone-900">{site.name}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="ניווט ראשי">
          {navLinks.map((link) => (
            <NavLink key={link.href} to={link.href} end={link.href === '/'} className={linkClass}>
              {link.name}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${site.phone}`}
            className="hidden lg:flex items-center gap-2 px-3 py-2 text-sm font-medium text-stone-700 hover:text-amber-600"
          >
            <Phone className="w-4 h-4" />
            <span dir="ltr">{site.phone}</span>
          </a>
          <Link
            to="/cart"
            onClick={() => setIsMobileMenuOpen(false)}
            className="relative p-2 rounded-lg text-stone-700 hover:bg-stone-100"
            aria-label={`סל קניות, ${itemCount} פריטים`}
          >
            <ShoppingCart className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-stone-900 text-xs font-bold flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
          <button
            className="md:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="תפריט"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="md:hidden border-t border-stone-200 bg-white px-4 py-4 flex flex-col gap-1" aria-label="ניווט ראשי">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
              className={(state) => `${linkClass(state)} py-3 text-lg`}
            >
              {link.name}
            </NavLink>
          ))}
          <a href={`tel:${site.phone}`} className="flex items-center gap-2 py-3 text-lg font-medium text-stone-700">
            <Phone className="w-5 h-5" />
            <span dir="ltr">{site.phone}</span>
          </a>
        </nav>
      )}
    </header>
  );
}
