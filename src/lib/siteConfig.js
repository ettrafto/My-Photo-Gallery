/**
 * Site Configuration Loader
 * 
 * Loads and validates site configuration from content/site/site.json
 * Provides a single source of truth for site-wide content like:
 * - Site title (header/nav)
 * - Owner name (copyright)
 * - Hero content (headline, subheadline, layout, images)
 * - Navigation items
 * - Social links
 * - SEO defaults
 * - Theme configuration
 * 
 * @example
 * import { getSiteConfig, getNavItems, getThemeName } from '../lib/siteConfig';
 * const config = getSiteConfig();
 * const navItems = getNavItems();
 * const theme = getThemeName();
 */

let cachedConfig = null;

/**
 * Loads and validates site configuration from JSON
 * @returns {Object} Site configuration object
 * @throws {Error} If required fields are missing
 */
export async function loadSiteConfig() {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}content/site/site.json`);
    if (!response.ok) {
      throw new Error(`Failed to load site config: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate required fields
    if (!data.site) {
      throw new Error('Site config is missing required "site" object');
    }

    if (!data.site.title || typeof data.site.title !== 'string') {
      throw new Error('Site config is missing required "site.title" (string)');
    }

    if (!data.site.ownerName || typeof data.site.ownerName !== 'string') {
      throw new Error('Site config is missing required "site.ownerName" (string)');
    }

    if (!data.hero) {
      throw new Error('Site config is missing required "hero" object');
    }

    if (!data.hero.headline || typeof data.hero.headline !== 'string') {
      throw new Error('Site config is missing required "hero.headline" (string)');
    }

    // Theme whitelist
    const VALID_THEMES = ['mono', 'paper'];

    // Optional fields with defaults
    const config = {
      site: {
        title: data.site.title,
        ownerName: data.site.ownerName,
        tagline: data.site.tagline || '',
      },
      theme: {
        name: data.theme?.name || 'mono',
      },
      seo: {
        defaultTitle: data.seo?.defaultTitle || data.site.title,
        titleTemplate: data.seo?.titleTemplate || `%s · ${data.site.title}`,
        description: data.seo?.description || '',
        siteUrl: data.seo?.siteUrl || '',
        ogImage: data.seo?.ogImage || '',
        twitterHandle: data.seo?.twitterHandle || '',
        robots: data.seo?.robots || 'index,follow',
      },
      nav: {
        items: data.nav?.items || [],
      },
      social: {
        items: data.social?.items || [],
      },
      hero: {
        headline: data.hero.headline,
        subheadline: data.hero.subheadline || '',
        layout: data.hero.layout || 'default', // Layout identifier for hero photo arrangement
        images: Array.isArray(data.hero.images) ? data.hero.images : [],
      },
    };

    // Validate theme name
    if (config.theme.name && !VALID_THEMES.includes(config.theme.name)) {
      console.warn(`Site config: Invalid theme name "${config.theme.name}". Valid themes: ${VALID_THEMES.join(', ')}. Defaulting to "mono".`);
      config.theme.name = 'mono';
    }

    // Validate layout if present
    if (config.hero.layout && typeof config.hero.layout !== 'string') {
      console.warn('Site config: hero.layout must be a string, defaulting to "default"');
      config.hero.layout = 'default';
    }

    // Cache the config
    cachedConfig = config;
    return config;
  } catch (error) {
    console.error('Error loading site config:', error);
    // Return fallback config to prevent crashes
    return {
      site: {
        title: 'PHOTO.LOG',
        ownerName: 'Evan Trafton',
      },
      seo: {
        defaultTitle: 'PHOTO.LOG',
        titleTemplate: '%s · PHOTO.LOG',
        description: '',
        siteUrl: '',
        ogImage: '',
        twitterHandle: '',
        robots: 'index,follow',
      },
      nav: {
        items: [],
      },
      social: {
        items: [],
      },
      theme: {
        name: 'mono',
      },
      hero: {
        headline: 'Welcome',
        subheadline: '',
        layout: 'default',
        images: [],
      },
    };
  }
}

/**
 * Get theme name from site config
 * @returns {string} Theme name (defaults to "mono")
 */
export function getThemeName() {
  const config = getSiteConfig();
  return config?.theme?.name || 'mono';
}

/**
 * Get enabled navigation items only
 * @returns {Array} Array of enabled nav items with valid label and href
 */
export function getNavItems() {
  const config = getSiteConfig();
  if (!config || !config.nav || !config.nav.items) {
    return [];
  }

  return config.nav.items
    .filter(item => {
      if (item.enabled === false) return false;
      if (!item.label || typeof item.label !== 'string') {
        console.warn('Site config: Skipping nav item with invalid label:', item);
        return false;
      }
      if (!item.href || typeof item.href !== 'string') {
        console.warn('Site config: Skipping nav item with invalid href:', item);
        return false;
      }
      return true;
    })
    .map(item => ({
      label: item.label,
      href: item.href,
    }));
}

/**
 * Get enabled social items only
 * @returns {Array} Array of enabled social items with valid label, href, and icon
 */
export function getSocialItems() {
  const config = getSiteConfig();
  if (!config || !config.social || !config.social.items) {
    return [];
  }

  return config.social.items
    .filter(item => {
      if (item.enabled === false) return false;
      if (!item.label || typeof item.label !== 'string') {
        console.warn('Site config: Skipping social item with invalid label:', item);
        return false;
      }
      if (!item.href || typeof item.href !== 'string') {
        console.warn('Site config: Skipping social item with invalid href:', item);
        return false;
      }
      return true;
    })
    .map(item => ({
      label: item.label,
      href: item.href,
      icon: item.icon || null,
    }));
}

/**
 * Get hero images from site config
 * @returns {Array} Array of hero images with valid src
 */
export function getHeroImages() {
  const config = getSiteConfig();
  const images = config?.hero?.images;
  if (!Array.isArray(images)) return [];

  return images
    .filter((item) => {
      if (!item?.src || typeof item.src !== 'string') {
        console.warn('Site config: Skipping hero image with invalid src:', item);
        return false;
      }
      return true;
    })
    .map((item) => ({
      src: item.src,
      alt: item.alt || item.caption || 'Hero image',
      caption: item.caption || null,
    }));
}

/**
 * Synchronous getter for site config (requires config to be loaded first)
 * Use this in components that need immediate access to config
 * 
 * @returns {Object|null} Cached site configuration or null if not loaded
 */
export function getSiteConfig() {
  return cachedConfig;
}

/**
 * Hook-like function for React components
 * Returns config and loading state
 * 
 * @returns {Promise<Object>} Site configuration
 */
export async function useSiteConfig() {
  return await loadSiteConfig();
}

