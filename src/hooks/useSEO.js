import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getSiteConfig, getDefaultOGImage } from '../lib/siteConfig';

/**
 * SEO Hook - Sets document title and meta tags from site config
 * 
 * Uses direct DOM manipulation (no heavy dependencies like React Helmet)
 * Preserves per-page title overrides via pageTitle prop
 * 
 * @param {Object} options
 * @param {string} options.pageTitle - Optional page-specific title (uses titleTemplate)
 * @param {string} options.description - Optional page-specific description (overrides default)
 * @param {string} options.ogImage - Optional page-specific OG image (overrides default)
 * @param {string} options.robots - Optional page-specific robots (overrides default)
 */
export function useSEO({ 
  pageTitle = null, 
  description = null, 
  ogImage = null,
  robots = null 
} = {}) {
  const location = useLocation();

  useEffect(() => {
    const config = getSiteConfig();
    if (!config || !config.seo) {
      return;
    }

    const seo = config.seo;
    const siteUrl = seo.siteUrl || '';
    const currentUrl = siteUrl + location.pathname;

    // Set document title
    if (pageTitle && seo.titleTemplate) {
      document.title = seo.titleTemplate.replace('%s', pageTitle);
    } else {
      document.title = seo.defaultTitle || config.site.title;
    }

    // Helper to set or update meta tag
    const setMetaTag = (name, content, property = false) => {
      if (!content) return;
      
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Set meta description
    setMetaTag('description', description || seo.description);

    // Set robots
    setMetaTag('robots', robots || seo.robots);

    // Determine OG image (page-specific > config > default hero image)
    // Safely get default OG image - may return null if config not loaded yet
    let defaultOGImage = ogImage || seo.ogImage;
    if (!defaultOGImage) {
      try {
        defaultOGImage = getDefaultOGImage();
      } catch (err) {
        // Config might not be loaded yet on direct page refresh
        defaultOGImage = null;
      }
    }
    
    // Make OG image absolute URL if siteUrl is configured and image is relative
    let ogImageUrl = defaultOGImage;
    if (ogImageUrl && siteUrl && !ogImageUrl.startsWith('http')) {
      // Remove leading slash if present to avoid double slash
      const imagePath = ogImageUrl.startsWith('/') ? ogImageUrl.slice(1) : ogImageUrl;
      ogImageUrl = siteUrl.replace(/\/$/, '') + '/' + imagePath;
    }

    // Open Graph tags
    setMetaTag('og:title', pageTitle ? seo.titleTemplate.replace('%s', pageTitle) : seo.defaultTitle, true);
    setMetaTag('og:description', description || seo.description, true);
    setMetaTag('og:image', ogImageUrl, true);
    setMetaTag('og:url', currentUrl, true);
    setMetaTag('og:type', 'website', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    if (seo.twitterHandle) {
      setMetaTag('twitter:site', seo.twitterHandle);
    }
    setMetaTag('twitter:title', pageTitle ? seo.titleTemplate.replace('%s', pageTitle) : seo.defaultTitle);
    setMetaTag('twitter:description', description || seo.description);
    setMetaTag('twitter:image', ogImageUrl);

  }, [location.pathname, pageTitle, description, ogImage, robots]);
}

