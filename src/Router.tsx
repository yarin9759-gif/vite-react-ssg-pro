import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './Layout'
import Home from './pages/home'

const Products = lazy(() => import('./pages/products'))
const Cart = lazy(() => import('./pages/cart'))
const About = lazy(() => import('./pages/about'))
const Contact = lazy(() => import('./pages/contact'))
const Booking = lazy(() => import('./pages/booking'))
const BookingStatus = lazy(() => import('./pages/booking-status'))
const Admin = lazy(() => import('./pages/admin'))

function Router() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="cart" element={<Cart />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="booking" element={<Booking />} />
            <Route path="booking-status" element={<BookingStatus />} />
            <Route path="admin" element={<Admin />} />
            <Route
              path='*'
              element={
                <div className="container mx-auto px-4 flex flex-col items-center justify-center text-center min-h-[60vh]">
                  <p className="text-6xl font-bold text-amber-500 mb-4">404</p>
                  <h1 className="text-3xl font-bold text-stone-900 mb-3">הדף לא נמצא</h1>
                  <p className="text-stone-600 mb-8">ייתכן שהקישור שגוי או שהדף הועבר.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/" className="px-7 py-3 rounded-lg bg-amber-500 text-stone-900 font-bold hover:bg-amber-400">
                      חזרה לדף הבית
                    </Link>
                    <Link to="/products" className="px-7 py-3 rounded-lg border border-stone-300 font-bold text-stone-700 hover:border-stone-500">
                      לקטלוג המוצרים
                    </Link>
                  </div>
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default Router
