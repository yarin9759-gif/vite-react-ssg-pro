import { Outlet, useLocation } from 'react-router';
import { type FC, Suspense, useEffect } from 'react';
import SEOTitle from './components/SEOTitle';
import LoadingScreen from './components/LoadingScreen';
import Navbar from '@/components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';

const Layout: FC = () => {
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  const content = (
    <>
      <SEOTitle />
      <div data-beasties-container className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppButton />
      </div>
    </>
  );

  return (
    <Suspense fallback={<LoadingScreen />}>
      {content}
    </Suspense>
  );
};

export default Layout;
