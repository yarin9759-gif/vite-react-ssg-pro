import { useEffect, type ReactElement } from 'react';
import { useLocation } from 'react-router';
import seoJson from '@/seo.json';

type SeoEntry = { title?: string } & Record<string, unknown>;
type SeoMap = Record<string, SeoEntry> & { _global?: Record<string, unknown> };

const seo = seoJson as SeoMap;

export default function SEOTitle(): ReactElement | null {
  const location = useLocation();

  useEffect(() => {
    if (!seo) return;
    const path = location.pathname || '/';
    const siteName = seo._global?.siteName as string | undefined;
    const config = seo[path.length > 1 ? path.replace(/\/$/, '') : path];
    const title = config ? config.title || siteName || document.title : `הדף לא נמצא – ${siteName ?? ''}`;
    if (title && document.title !== title) {
      document.title = title;
    }
  }, [location]);

  return null;
}
