import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { loadSiteConfig, getHeroImages } from '../lib/siteConfig';
import Photo from './Photo';
import SkeletonHero from './skeleton/SkeletonHero';
import './Hero.css';

/**
 * Normalize image path to ensure it's absolute and handles BASE_URL correctly
 */
function normalizeImagePath(path) {
  if (!path) return '';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Combine with BASE_URL, removing any double slashes
  const baseUrl = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Hero - Full-width hero section blending Data-Driven Photographer and Dynamic Depth Grid styles
 * Features floating diagonal image cluster, animated grid background, and retro EXIF overlays
 * 
 * Content (headline, subheadline, layout, images) is loaded from content/site/site.json
 * Layout determines which photo arrangement to use (currently only "default" is implemented)
 * Hero images can be configured via hero.images (array)
 * 
 * @param {Object} props
 * @param {Array<{src: string, srcSmall?: string, srcLarge?: string, alt: string, caption?: string, href?: string}>} props.images
 *   - Fallback hero images (used only if hero.images is missing/empty)
 */
export default function Hero({ 
  images = defaultImages
}) {
  const [siteConfig, setSiteConfig] = useState(null);
  const [headline, setHeadline] = useState('Welcome'); // Fallback
  const [subheadline, setSubheadline] = useState(''); // Fallback
  const [layout, setLayout] = useState('default'); // Layout identifier
  const [heroImages, setHeroImages] = useState([]); // Hero images from JSON
  const [variantFallback, setVariantFallback] = useState(() => ({})); // { [index]: true } if webp variants 404
  const [hoveredImage, setHoveredImage] = useState(null);
  const [tappedImage, setTappedImage] = useState(null);
  const [loadedCount, setLoadedCount] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Load site config for hero content
  useEffect(() => {
    async function fetchConfig() {
      const config = await loadSiteConfig();
      setSiteConfig(config);
      setHeadline(config.hero.headline || 'Welcome');
      setSubheadline(config.hero.subheadline || '');
      setLayout(config.hero.layout || 'default');
      
      // Load hero images from JSON (fallback to defaults if none configured)
      const items = getHeroImages();
      setHeroImages(items.length > 0 ? items : images);
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    const imageCount = (heroImages?.length || images.length);
    if (loadedCount >= imageCount) {
      setShowSkeleton(false);
    }
  }, [loadedCount, images.length, heroImages.length]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Handle touch/tap for mobile devices
  const handleTap = (index) => {
    setTappedImage(tappedImage === index ? null : index);
  };

  return (
    <section className="hero">
      {/* Animated Grid Background */}
      <div className="hero-grid-background" aria-hidden="true" />
      
      <div className="hero-container">
        {/* Left Text Block */}
        <motion.div 
          className="hero-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="hero-headline">{headline}</h1>
          {subheadline && <p className="hero-subheadline">{subheadline}</p>}
        </motion.div>

        {/* Right Image Cluster - Layout: {layout} */}
        <div className={`hero-images hero-layout-${layout}`}>
          {(heroImages.length > 0 ? heroImages : images).map((item, index) => {
            const rawSrc = item.src || '';
            const prefersOriginal = !!variantFallback[index];

            // Derive responsive variants automatically from `src`:
            // - If src is already "*-large.webp": small is "*-small.webp"
            // - If src is an original (jpg/png/heic/etc): variants are "<base>-{small|large}.webp"
            const withoutExt = rawSrc.replace(/\.[^/.]+$/i, '');
            const isLargeWebp = rawSrc.toLowerCase().endsWith('-large.webp');
            const isSmallWebp = rawSrc.toLowerCase().endsWith('-small.webp');
            const isAnyWebp = rawSrc.toLowerCase().endsWith('.webp');

            const derivedLarge = isSmallWebp
              ? rawSrc.replace(/-small\.webp$/i, '-large.webp')
              : isLargeWebp
              ? rawSrc
              : `${withoutExt}-large.webp`;

            const derivedSmall = isLargeWebp
              ? rawSrc.replace(/-large\.webp$/i, '-small.webp')
              : isSmallWebp
              ? rawSrc
              : `${withoutExt}-small.webp`;

            // Performance:
            // - Prefer webp variants when possible (after running process:hero)
            // - If variants 404, fall back to the original src
            // - Only provide srcSmall if explicitly provided in item.srcSmall to avoid 404s
            //   Browser will try to load srcSet images, causing 404s if they don't exist
            //   We can't check file existence client-side, so only use explicit srcSmall
            const effectiveSrc = prefersOriginal ? rawSrc : derivedLarge;
            // Only use srcSmall if explicitly provided - don't auto-derive to prevent 404s
            // If process:hero has generated small variants, they should be in item.srcSmall
            const effectiveSrcSmall = item.srcSmall || undefined;
            const effectiveSrcLarge = prefersOriginal ? undefined : derivedLarge;

            const sharedProps = {
              className: `hero-image-wrapper hero-image-${index + 1} ${tappedImage === index ? 'tapped' : ''}`,
              // Keep the default state free of transform so CSS hover lift works reliably.
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: {
                duration: 0.6,
                delay: index * 0.15,
                ease: 'easeOut',
              },
              onHoverStart: () => setHoveredImage(index),
              onHoverEnd: () => setHoveredImage(null),
              onTap: () => handleTap(index),
            };

            const content = (
              <div className="hero-image-inner">
                <Photo
                  src={normalizeImagePath(effectiveSrc)}
                  srcSmall={effectiveSrcSmall ? normalizeImagePath(effectiveSrcSmall) : undefined}
                  srcLarge={effectiveSrcLarge ? normalizeImagePath(effectiveSrcLarge) : undefined}
                  alt={item.alt}
                  className="hero-image"
                  loading={index < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={index < 2 ? 'high' : 'auto'}
                  onLoad={() => setLoadedCount((count) => count + 1)}
                  onError={() => {
                    // If we were trying derived webp variants, fall back to the original src.
                    if (!prefersOriginal && !isAnyWebp) {
                      setVariantFallback((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
                    }
                  }}
                  aspectRatio={1.5}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Caption overlay if present */}
                {item.caption && (
                  <div className={`hero-exif-overlay ${hoveredImage === index || tappedImage === index ? 'active' : ''}`}>
                    <span className="hero-exif-text">{item.caption}</span>
                  </div>
                )}
              </div>
            );

            return (
              <motion.div key={index} {...sharedProps}>
                {content}
              </motion.div>
            );
          })}
        </div>
      </div>

      {showSkeleton && (
        <div className="hero-skeleton-overlay" aria-hidden="true">
          <SkeletonHero />
        </div>
      )}
    </section>
  );
}

// Default featured images (fallback if config has no hero.images)
// Using WebP paths for efficiency
const defaultImages = [
  {
    src: '/hero/hero-1-large.webp',
    caption: 'IMG_9281.JPG — 24mm • f/8.0 • 1/250s • ISO 100',
    alt: 'Desert landscape at golden hour',
  },
  {
    src: '/hero/hero-2-large.webp',
    caption: 'IMG_9049.JPG — 35mm • f/5.6 • 1/500s • ISO 200',
    alt: 'Desert arch formation',
  },
  {
    src: '/hero/hero-3-large.webp',
    caption: 'IMG_9158.JPG — 50mm • f/4.0 • 1/320s • ISO 100',
    alt: 'Canyon rock formations',
  },
  {
    src: '/hero/hero-4-large.webp',
    caption: 'IMG_9383.JPG — 85mm • f/2.8 • 1/640s • ISO 400',
    alt: 'Wildlife portrait',
  },
  {
    src: '/hero/hero-5-large.webp',
    caption: 'IMG_9439.JPG — 55mm • f/7.1 • 1/400s • ISO 100',
    alt: 'Mountain landscape',
  }
];

