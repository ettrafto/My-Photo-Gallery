import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { useLowQualityMode } from '../hooks/useLowQualityMode';

/**
 * Photo - Shared optimized image component for all photo rendering
 * 
 * @typedef {import('../types/image.jsdoc').BasePhotoProps} BasePhotoProps
 * 
 * Features:
 * - Lazy loading by default (can be disabled for above-fold images)
 * - Async decoding for better main thread performance
 * - Responsive images via srcSet when multiple sizes available
 * - Prevents layout shift by reserving space
 * - Styling-agnostic (passes through className)
 * 
 * @example
 * // Basic usage
 * <Photo 
 *   src="/images/photo.jpg" 
 *   alt="Description"
 *   width={1200}
 *   height={800}
 * />
 * 
 * @example
 * // With responsive images
 * <Photo
 *   srcSmall="/images/photo-small.jpg"
 *   src="/images/photo-medium.jpg"
 *   srcLarge="/images/photo-large.jpg"
 *   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
 *   alt="Description"
 *   aspectRatio={1.5}
 * />
 * 
 * @example
 * // Eager loading for above-fold content
 * <Photo
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   loading="eager"
 *   width={1920}
 *   height={1080}
 * />
 */
const Photo = forwardRef(({
  // Image sources
  src,                    // Required: main image source
  srcSmall,              // Optional: small size (e.g., for mobile)
  srcLarge,              // Optional: large size (e.g., for desktop)
  alt = '',              // Required for accessibility
  
  // Sizing (provide width+height OR aspectRatio to prevent layout shift)
  width,                 // Image width in pixels
  height,                // Image height in pixels
  aspectRatio,           // Aspect ratio (e.g., 1.5 for 3:2, 0.75 for 3:4)
  
  // Responsive images
  sizes,                 // sizes attribute for srcSet (e.g., "(max-width: 768px) 100vw, 50vw")
  
  // Loading behavior
  loading = 'lazy',      // 'lazy' | 'eager' - default lazy for performance
  decoding = 'async',    // 'async' | 'sync' | 'auto' - default async
  fetchPriority,         // 'high' | 'low' | 'auto' - for critical images
  
  // Quality mode
  enableLowQualityMode = true,  // Enable automatic low-quality mode
  lowQualityBreakpoint = 768,   // Viewport width threshold for low-quality
  
  // Styling
  className = '',        // Pass through for layout-specific styles
  style,                 // Inline styles
  
  // Event handlers
  onLoad,
  onError,
  onClick,
  
  // Other attributes
  ...rest
}, ref) => {
  // Determine if low-quality mode should be used
  const isLowQualityViewport = useLowQualityMode({ 
    breakpoint: lowQualityBreakpoint 
  });
  const useLowQuality = enableLowQualityMode && isLowQualityViewport;
  // Build srcSet if multiple sizes provided, respecting low-quality mode
  const buildSrcSet = () => {
    const sources = [];
    
    if (srcSmall) {
      // Assume small is for mobile (~800px)
      sources.push(`${srcSmall} 800w`);
    }
    if (src && src !== srcSmall) {
      // Assume main src is medium (~1200px)
      sources.push(`${src} 1200w`);
    }
    // Only include large variant if NOT in low-quality mode
    if (!useLowQuality && srcLarge && srcLarge !== src) {
      // Assume large is for desktop (~1800px)
      sources.push(`${srcLarge} 1800w`);
    }
    
    return sources.length > 1 ? sources.join(', ') : null;
  };

  const srcSet = buildSrcSet();
  
  // Choose effective src based on quality mode
  const effectiveSrc = useLowQuality 
    ? (srcSmall || src)  // Use smallest available in low-quality mode
    : (src || srcSmall); // Use preferred size in normal mode
    
  // Adjust sizes attribute for low-quality mode
  const effectiveSizes = useLowQuality 
    ? '100vw'  // Full width in low-quality (mobile)
    : sizes;   // Use provided sizes in normal mode

  // Build inline styles for layout reservation
  const buildStyle = () => {
    const inlineStyle = { ...style };
    
    // Set aspect ratio if provided (preferred method)
    if (aspectRatio && !width && !height) {
      inlineStyle.aspectRatio = aspectRatio;
    }
    
    return Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined;
  };

  return (
    <img
      ref={ref}
      src={effectiveSrc}
      srcSet={srcSet || undefined}
      sizes={srcSet ? effectiveSizes : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      style={buildStyle()}
      onLoad={onLoad}
      onError={onError}
      onClick={onClick}
      {...rest}
    />
  );
});

Photo.displayName = 'Photo';

Photo.propTypes = {
  // Required
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
  
  // Sources
  srcSmall: PropTypes.string,
  srcLarge: PropTypes.string,
  
  // Sizing
  width: PropTypes.number,
  height: PropTypes.number,
  aspectRatio: PropTypes.number,
  
  // Responsive
  sizes: PropTypes.string,
  
  // Loading
  loading: PropTypes.oneOf(['lazy', 'eager']),
  decoding: PropTypes.oneOf(['async', 'sync', 'auto']),
  fetchPriority: PropTypes.oneOf(['high', 'low', 'auto']),
  
  // Quality mode
  enableLowQualityMode: PropTypes.bool,
  lowQualityBreakpoint: PropTypes.number,
  
  // Styling
  className: PropTypes.string,
  style: PropTypes.object,
  
  // Events
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  onClick: PropTypes.func,
};

export default Photo;



