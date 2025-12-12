/**
 * Image Utilities for Responsive Loading
 * 
 * These utilities help generate responsive image URLs and sizes strings
 * for optimal loading performance across different screen sizes.
 */

/**
 * Generate sizes attribute for responsive images
 * Calculates appropriate sizes based on common breakpoints
 * 
 * @param {Object} options
 * @param {number} options.columns - Number of columns in grid layout (default: 3)
 * @param {string} options.layoutMode - 'grid' | 'masonry' | 'full' (default: 'grid')
 * @returns {string} sizes attribute value
 * 
 * @example
 * // 3-column grid
 * generateSizesAttribute({ columns: 3, layoutMode: 'grid' })
 * // Returns: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
 * 
 * // Full width
 * generateSizesAttribute({ layoutMode: 'full' })
 * // Returns: "100vw"
 */
export function generateSizesAttribute({ columns = 3, layoutMode = 'grid' } = {}) {
  if (layoutMode === 'full') {
    return '100vw';
  }

  // Mobile: always full width
  // Tablet: 2 columns
  // Desktop: specified columns
  const desktopWidth = Math.round(100 / columns);
  
  return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${desktopWidth}vw`;
}

/**
 * Generate responsive image URLs from a single source
 * 
 * TODO: When multiple image sizes are available in the data model,
 * this function should be updated to return actual different URLs.
 * For now, it returns the same URL for all sizes as a placeholder.
 * 
 * Future implementation might look like:
 * - Small: /images/album/photo-400w.jpg
 * - Medium: /images/album/photo-800w.jpg
 * - Large: /images/album/photo-1600w.jpg
 * 
 * @param {string} src - Original image source
 * @returns {{src: string, srcSmall: string, srcLarge: string}} Responsive URLs
 * 
 * @example
 * const { src, srcSmall, srcLarge } = generateResponsiveUrls('/images/photo.jpg');
 * // Currently returns same URL for all sizes
 * // Future: will return actual different sized images
 */
export function generateResponsiveUrls(src) {
  // TODO: When the data model supports multiple sizes, implement actual URL generation
  // For now, return the same URL for all sizes
  // This prepares the API so we don't need to refactor components later
  
  return {
    srcSmall: src,   // TODO: Generate small version (400w)
    src: src,        // Main source (800w)
    srcLarge: src,   // TODO: Generate large version (1600w)
  };
}

/**
 * Calculate optimal image dimensions based on aspect ratio and desired width
 * Useful for generating width/height attributes to prevent layout shift
 * 
 * @param {Object} options
 * @param {number} options.aspectRatio - Image aspect ratio (width/height)
 * @param {number} options.targetWidth - Desired width in pixels
 * @returns {{width: number, height: number}} Calculated dimensions
 * 
 * @example
 * calculateImageDimensions({ aspectRatio: 1.5, targetWidth: 800 })
 * // Returns: { width: 800, height: 533 }
 */
export function calculateImageDimensions({ aspectRatio, targetWidth }) {
  if (!aspectRatio || !targetWidth) {
    return { width: undefined, height: undefined };
  }
  
  const height = Math.round(targetWidth / aspectRatio);
  return { width: targetWidth, height };
}

/**
 * Get appropriate sizes string for album grid layouts
 * Adapts to the number of columns selected by user
 * 
 * @param {number} imagesAcross - Number of images across (1-5)
 * @returns {string} sizes attribute
 * 
 * @example
 * getAlbumGridSizes(3) // 3 columns
 * // Returns: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
 * 
 * getAlbumGridSizes(5) // 5 columns
 * // Returns: "(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 20vw"
 */
export function getAlbumGridSizes(imagesAcross) {
  const desktopWidth = Math.round(100 / imagesAcross);
  
  // Mobile: always 1 column (100vw)
  // Tablet: 2 columns (50vw) or 3 columns (33vw) for 4+ images
  const tabletWidth = imagesAcross >= 4 ? 33 : 50;
  
  return `(max-width: 640px) 100vw, (max-width: 1024px) ${tabletWidth}vw, ${desktopWidth}vw`;
}

/**
 * Get sizes string for trip gallery grid
 * Fixed responsive breakpoints for trip photo grids
 * 
 * @returns {string} sizes attribute
 */
export function getTripGallerySizes() {
  // Trip gallery uses auto-fill grid with min 250px
  // Mobile: 1 column, Tablet: 2 columns, Desktop: 3-4 columns
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
}

/**
 * Check if an image should be lazy loaded
 * Some images (hero, above-fold) should load immediately
 * 
 * @param {Object} options
 * @param {number} options.index - Image index in list
 * @param {number} options.threshold - How many images to load eagerly (default: 6)
 * @returns {boolean} True if should lazy load
 * 
 * @example
 * shouldLazyLoad({ index: 3, threshold: 6 }) // false - loads eagerly
 * shouldLazyLoad({ index: 10, threshold: 6 }) // true - lazy loads
 */
export function shouldLazyLoad({ index, threshold = 6 } = {}) {
  // Load first few images eagerly (likely above fold)
  // Lazy load the rest
  return index >= threshold;
}

/**
 * Preload an image programmatically
 * Useful for lightbox navigation (preload next/previous images)
 * 
 * @param {string} src - Image URL to preload
 * @returns {Promise<void>} Resolves when image is loaded
 * 
 * @example
 * // Preload next image in lightbox
 * await preloadImage('/images/next-photo.jpg');
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
    img.src = src;
  });
}

/**
 * Get optimal loading strategy for an image context
 * Returns recommended loading, fetchPriority, and decoding settings
 * 
 * @param {Object} options
 * @param {string} options.context - 'hero' | 'above-fold' | 'grid' | 'lightbox'
 * @param {number} options.index - Position in list (for grids)
 * @returns {Object} Loading strategy
 * 
 * @example
 * getLoadingStrategy({ context: 'hero' })
 * // { loading: 'eager', fetchPriority: 'high', decoding: 'async' }
 * 
 * getLoadingStrategy({ context: 'grid', index: 10 })
 * // { loading: 'lazy', fetchPriority: undefined, decoding: 'async' }
 */
export function getLoadingStrategy({ context, index = 0 } = {}) {
  const strategy = {
    loading: 'lazy',
    fetchPriority: undefined,
    decoding: 'async',
  };

  switch (context) {
    case 'hero':
    case 'above-fold':
      // Critical images that should load immediately
      strategy.loading = 'eager';
      strategy.fetchPriority = 'high';
      break;
      
    case 'lightbox':
      // Lightbox images should load immediately when opened
      strategy.loading = 'eager';
      strategy.fetchPriority = 'high';
      break;
      
    case 'grid':
      // First few grid images load eagerly, rest lazy
      if (index < 6) {
        strategy.loading = 'eager';
      }
      break;
      
    default:
      // Default: lazy load
      break;
  }

  return strategy;
}

/**
 * Build complete Photo/LazyImage props from photo data
 * Convenience function to generate all props needed for Photo component
 * 
 * @param {Object} photo - Photo object from JSON
 * @param {Object} options - Additional options
 * @returns {Object} Props for Photo/LazyImage component
 * 
 * @example
 * const photo = {
 *   path: 'images/photo.jpg',
 *   filename: 'IMG_001.JPG',
 *   width: 4000,
 *   height: 3000,
 *   aspectRatio: 1.33,
 *   exif: { description: 'Sunset' }
 * };
 * 
 * const props = buildPhotoProps(photo, {
 *   baseUrl: '/base/',
 *   sizes: '(max-width: 768px) 100vw, 50vw',
 *   className: 'my-photo'
 * });
 */
export function buildPhotoProps(photo, options = {}) {
  const {
    baseUrl = '',
    sizes,
    className = '',
    loading = 'lazy',
    useLazyImage = true,
  } = options;

  const main = photo.pathLarge || photo.path || photo.src || '';
  const small = photo.pathSmall || photo.path || main;
  const blur = photo.pathBlur;
  const large = photo.pathLarge || main;

  const src = main ? `${baseUrl}${main}` : undefined;
  const srcSmall = small ? `${baseUrl}${small}` : undefined;
  const srcLarge = large ? `${baseUrl}${large}` : undefined;
  const placeholderSrc = blur ? `${baseUrl}${blur}` : undefined;
  
  return {
    src,
    srcSmall,
    srcLarge,
    placeholderSrc,
    alt: photo.exif?.description || photo.filename || 'Photo',
    width: photo.width,
    height: photo.height,
    aspectRatio: photo.aspectRatio,
    sizes,
    className,
    loading: useLazyImage ? 'eager' : loading, // LazyImage handles its own loading
  };
}





