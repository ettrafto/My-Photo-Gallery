import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadSiteConfig, getHeroGridItems } from '../lib/siteConfig';
import Photo from './Photo';
import SkeletonHero from './skeleton/SkeletonHero';
import './Hero.css';

/**
 * Hero - Full-width hero section blending Data-Driven Photographer and Dynamic Depth Grid styles
 * Features floating diagonal image cluster, animated grid background, and retro EXIF overlays
 * 
 * Content (headline, subheadline, layout, grid) is loaded from content/site/site.json
 * Layout determines which photo arrangement to use (currently only "default" is implemented)
 * Grid items can be configured via hero.grid (enabled + items array)
 * 
 * @param {Object} props
 * @param {Array<{url: string, exif: string, alt: string, orientation: 'portrait'|'landscape'|'square'}>} props.images - Array of 5 feature images (fallback if grid disabled)
 */
export default function Hero({ 
  images = defaultImages
}) {
  const [siteConfig, setSiteConfig] = useState(null);
  const [headline, setHeadline] = useState('Welcome'); // Fallback
  const [subheadline, setSubheadline] = useState(''); // Fallback
  const [layout, setLayout] = useState('default'); // Layout identifier
  const [gridItems, setGridItems] = useState([]); // Hero grid items from JSON
  const [useGrid, setUseGrid] = useState(false); // Whether to use grid items
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
      
      // Load grid items if enabled
      const items = getHeroGridItems();
      if (items.length > 0) {
        setGridItems(items);
        setUseGrid(true);
      } else {
        setUseGrid(false);
      }
    }
    fetchConfig();
  }, []);

  useEffect(() => {
    const imageCount = useGrid ? gridItems.length : images.length;
    if (loadedCount >= imageCount) {
      setShowSkeleton(false);
    }
  }, [loadedCount, images.length, gridItems.length, useGrid]);

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
          {useGrid ? (
            // Render grid items from JSON
            gridItems.map((item, index) => {
              const imageWrapper = (
                <motion.div
                  className={`hero-image-wrapper hero-image-${index + 1} ${tappedImage === index ? 'tapped' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.15,
                    ease: 'easeOut' 
                  }}
                  whileHover={{ 
                    y: -12, 
                    transition: { duration: 0.3, ease: 'easeOut' }
                  }}
                  onHoverStart={() => setHoveredImage(index)}
                  onHoverEnd={() => setHoveredImage(null)}
                  onTap={() => handleTap(index)}
                >
                  <div className="hero-image-inner">
                    <Photo
                      src={`${import.meta.env.BASE_URL}${item.src}`}
                      alt={item.alt}
                      className="hero-image"
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      onLoad={() => setLoadedCount(count => count + 1)}
                      aspectRatio={1.5}
                    />
                    
                    {/* Caption overlay if present */}
                    {item.caption && (
                      <div className={`hero-exif-overlay ${hoveredImage === index || tappedImage === index ? 'active' : ''}`}>
                        <span className="hero-exif-text">{item.caption}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );

              // Wrap with link if href provided
              if (item.href) {
                const isInternal = item.href.startsWith('/');
                if (isInternal) {
                  return (
                    <Link key={index} to={item.href} className="hero-grid-link">
                      {imageWrapper}
                    </Link>
                  );
                } else {
                  return (
                    <a key={index} href={item.href} className="hero-grid-link" target="_blank" rel="noopener noreferrer">
                      {imageWrapper}
                    </a>
                  );
                }
              }
              return <div key={index}>{imageWrapper}</div>;
            })
          ) : (
            // Render default images (fallback)
            images.map((image, index) => (
              <motion.div
                key={index}
                className={`hero-image-wrapper hero-image-${index + 1} hero-image-${image.orientation} ${tappedImage === index ? 'tapped' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.15,
                  ease: 'easeOut' 
                }}
                whileHover={{ 
                  y: -12, 
                  transition: { duration: 0.3, ease: 'easeOut' }
                }}
                onHoverStart={() => setHoveredImage(index)}
                onHoverEnd={() => setHoveredImage(null)}
                onTap={() => handleTap(index)}
              >
                <div className="hero-image-inner">
                  <img 
                    src={image.url} 
                    alt={image.alt}
                    className="hero-image"
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    onLoad={() => setLoadedCount(count => count + 1)}
                  />
                  
                  {/* Retro EXIF Overlay */}
                  <div className={`hero-exif-overlay ${hoveredImage === index || tappedImage === index ? 'active' : ''}`}>
                    <span className="hero-exif-text">{image.exif}</span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
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

// Default featured images with mock EXIF data
const defaultImages = [
  {
    url: '/hero/hero-1.JPG',
    exif: 'IMG_9281.JPG — 24mm • f/8.0 • 1/250s • ISO 100',
    alt: 'Desert landscape at golden hour',
    orientation: 'portrait'
  },
  {
    url: '/hero/hero-2.JPG',
    exif: 'IMG_9049.JPG — 35mm • f/5.6 • 1/500s • ISO 200',
    alt: 'Desert arch formation',
    orientation: 'landscape'
  },
  {
    url: '/hero/hero-3.JPG',
    exif: 'IMG_9158.JPG — 50mm • f/4.0 • 1/320s • ISO 100',
    alt: 'Canyon rock formations',
    orientation: 'square'
  },
  {
    url: '/hero/hero-4.JPG',
    exif: 'IMG_9383.JPG — 85mm • f/2.8 • 1/640s • ISO 400',
    alt: 'Wildlife portrait',
    orientation: 'portrait'
  },
  {
    url: '/hero/hero-5.JPG',
    exif: 'IMG_9439.JPG — 55mm • f/7.1 • 1/400s • ISO 100',
    alt: 'Mountain landscape',
    orientation: 'landscape'
  }
];

