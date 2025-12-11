/**
 * SEO Component
 * Provides dynamic meta tags, Open Graph, and Twitter Card tags
 */

import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  keywords?: string[];
  author?: string;
  noindex?: boolean;
}

const defaultTitle = 'BETAPREDIT - Análisis Predictivo de Apuestas Deportivas';
const defaultDescription = 'Plataforma profesional de análisis predictivo para apuestas deportivas. Predicciones basadas en IA, value bets, arbitraje y estadísticas avanzadas.';
const defaultImage = '/og-image.png';
const defaultUrl = 'https://betapredit.com';

export default function SEO({
  title,
  description = defaultDescription,
  image = defaultImage,
  url = defaultUrl,
  type = 'website',
  keywords = ['apuestas deportivas', 'predicciones', 'value bets', 'arbitraje', 'análisis predictivo'],
  author = 'BETAPREDIT',
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title ? `${title} | BETAPREDIT` : defaultTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords.join(', '));
    updateMetaTag('author', author);

    // Open Graph tags
    updateMetaTag('og:title', title || defaultTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', image.startsWith('http') ? image : `${defaultUrl}${image}`, 'property');
    updateMetaTag('og:url', url, 'property');
    updateMetaTag('og:type', type, 'property');
    updateMetaTag('og:site_name', 'BETAPREDIT', 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title || defaultTitle);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image.startsWith('http') ? image : `${defaultUrl}${image}`);

    // Robots
    if (noindex) {
      updateMetaTag('robots', 'noindex, nofollow');
    } else {
      updateMetaTag('robots', 'index, follow');
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);
  }, [title, description, image, url, type, keywords, author, noindex]);

  return null; // This component doesn't render anything
}

