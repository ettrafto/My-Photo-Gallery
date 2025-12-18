/**
 * Site Configuration Loader
 * 
 * Loads and validates site configuration from content/site/site.json
 * Provides a single source of truth for site-wide content like:
 * - Site title (header/nav)
 * - Owner name (copyright)
 * - Hero content (headline, subheadline, layout, grid)
 * - Navigation items
 * - Social links
 * - SEO defaults
 * 
 * @example
 * import { getSiteConfig, getNavItems } from '../lib/siteConfig';
 * const config = getSiteConfig();
 * const navItems = getNavItems();
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

    // Optional fields with defaults
    const config = {
      site: {
        title: data.site.title,
        ownerName: data.site.ownerName,
        tagline: data.site.tagline || '',
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
        grid: {
          enabled: data.hero.grid?.enabled !== undefined ? data.hero.grid.enabled : false,
          items: data.hero.grid?.items || [],
        },
      },
    };

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
      hero: {
        headline: 'Welcome',
        subheadline: '',
        layout: 'default',
        grid: {
          enabled: false,
          items: [],
        },
      },
    };
  }
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
 * Get enabled hero grid items only (max 3)
 * @returns {Array} Array of enabled hero grid items with valid src and alt
 */
export function getHeroGridItems() {
  const config = getSiteConfig();
  if (!config || !config.hero || !config.hero.grid || !config.hero.grid.enabled) {
    return [];
  }

  if (!config.hero.grid.items || !Array.isArray(config.hero.grid.items)) {
    return [];
  }

  return config.hero.grid.items
    .filter(item => {
      if (!item.src || typeof item.src !== 'string') {
        console.warn('Site config: Skipping hero grid item with invalid src:', item);
        return false;
      }
      return true;
    })
    .slice(0, 3) // Max 3 items
    .map(item => ({
      src: item.src,
      alt: item.alt || item.caption || 'Hero image',
      caption: item.caption || null,
      href: item.href || null,
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

