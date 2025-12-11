import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Photo from './Photo';
import './LazyImage.css';

/**
 * LazyImage - Smarter lazy loading wrapper using IntersectionObserver
 * 
 * @typedef {import('../types/image.jsdoc').LazyImageProps} LazyImageProps
 * 
 * Benefits over native loading="lazy":
 * - More control over when images start loading (customizable threshold)
 * - Shows placeholder/skeleton until image is in viewport
 * - Smoother loading experience with fade-in animation
 * - Proper cleanup to avoid memory leaks
 * - Works consistently across all browsers
 * 
 * Use this for:
 * - Album grids with many photos
 * - Long scrollable lists
 * - Any page with 20+ images
 * 
 * @example
 * <LazyImage
 *   src="/images/photo.jpg"
 *   alt="Description"
 *   width={1200}
 *   height={800}
 *   className="my-custom-class"
 * />
 * 
 * @example
 * // With placeholder color
 * <LazyImage
 *   src="/images/photo.jpg"
 *   alt="Description"
 *   aspectRatio={1.5}
 *   placeholderColor="#1a1a1a"
 * />
 * 
 * @example
 * // With blur-up effect
 * <LazyImage
 *   src="/images/photo.jpg"
 *   placeholderSrc="/images/photo-tiny.jpg"
 *   alt="Description"
 *   aspectRatio={1.5}
 * />
 */
export default function LazyImage({
  // All Photo props can be passed through
  src,
  srcSmall,
  srcLarge,
  alt,
  width,
  height,
  aspectRatio,
  sizes,
  className = '',
  style,
  onLoad,
  onClick,
  
  // LazyImage-specific props
  placeholderSrc,           // Optional: tiny placeholder image for blur-up
  placeholderColor = '#0a0a0a',  // Placeholder background color
  threshold = 0.01,         // How much of image must be visible to trigger load (0-1)
  rootMargin = '50px',      // Load images this far before they enter viewport
  fadeInDuration = 300,     // Fade-in animation duration in ms
  showSkeleton = true,      // Show animated skeleton loader
  
  // Quality mode (passed through to Photo)
  enableLowQualityMode = true,
  lowQualityBreakpoint = 768,
  
  // Pass through other props
  ...rest
}) {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Set up IntersectionObserver
  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // Create observer to detect when image enters viewport
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Once visible, stop observing to save resources
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(element);

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin]);

  // Handle image load
  const handleLoad = (e) => {
    setIsLoaded(true);
    setHasError(false);
    if (onLoad) onLoad(e);
  };

  // Handle image error
  const handleError = (e) => {
    setHasError(true);
    console.error('Failed to load image:', src);
  };

  // Build wrapper classes
  const wrapperClasses = [
    'lazy-image-wrapper',
    className,
    isLoaded ? 'lazy-image-loaded' : '',
    hasError ? 'lazy-image-error' : '',
  ].filter(Boolean).join(' ');

  // Build inline styles for wrapper (preserves space)
  const wrapperStyle = {
    ...style,
    backgroundColor: placeholderColor,
  };

  if (aspectRatio && !width && !height) {
    wrapperStyle.aspectRatio = aspectRatio;
  }

  return (
    <div 
      ref={imgRef}
      className={wrapperClasses}
      style={wrapperStyle}
      onClick={onClick}
    >
      {/* Skeleton loader (shows before image is in view) */}
      {!isInView && showSkeleton && (
        <div className="lazy-image-skeleton" aria-hidden="true" />
      )}

      {/* Blur-up placeholder (shows if provided) */}
      {!isLoaded && placeholderSrc && isInView && (
        <img
          src={placeholderSrc}
          alt=""
          className="lazy-image-placeholder"
          aria-hidden="true"
        />
      )}

      {/* Main image (only renders when in viewport) */}
      {isInView && !hasError && (
        <Photo
          src={src}
          srcSmall={srcSmall}
          srcLarge={srcLarge}
          alt={alt}
          width={width}
          height={height}
          aspectRatio={aspectRatio}
          sizes={sizes}
          loading="eager"  // We're handling lazy loading ourselves
          enableLowQualityMode={enableLowQualityMode}
          lowQualityBreakpoint={lowQualityBreakpoint}
          className={`lazy-image-photo ${isLoaded ? 'lazy-image-photo-visible' : ''}`}
          style={{ 
            transitionDuration: `${fadeInDuration}ms`,
          }}
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="lazy-image-error-message">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
}

LazyImage.propTypes = {
  // Photo props
  src: PropTypes.string.isRequired,
  srcSmall: PropTypes.string,
  srcLarge: PropTypes.string,
  alt: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  aspectRatio: PropTypes.number,
  sizes: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  onLoad: PropTypes.func,
  onClick: PropTypes.func,
  
  // LazyImage-specific
  placeholderSrc: PropTypes.string,
  placeholderColor: PropTypes.string,
  threshold: PropTypes.number,
  rootMargin: PropTypes.string,
  fadeInDuration: PropTypes.number,
  showSkeleton: PropTypes.bool,
  
  // Quality mode
  enableLowQualityMode: PropTypes.bool,
  lowQualityBreakpoint: PropTypes.number,
};



