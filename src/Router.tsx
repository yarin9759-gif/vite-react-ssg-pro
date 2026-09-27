import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './Layout'
import Home from './pages/home'

const Products = lazy(() => import('./pages/products'))
const Cart = lazy(() => import('./pages/cart'))
const About = lazy(() => import('./pages/about'))
const Contact = lazy(() => import('./pages/contact'))

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
            <Route
              path='*'
              element={
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                  <h1 className="text-3xl font-bold mb-4">הדף לא נמצא</h1>
                  <Link to="/" className="font-medium text-amber-600 hover:text-amber-700">חזרה לדף הבית</Link>
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
