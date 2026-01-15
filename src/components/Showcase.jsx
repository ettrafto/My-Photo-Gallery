/**
 * Showcase Component - Single image layout with side-entry animations
 * 
 * Features:
 * - Loads images from content/site/showcase.json
 * - Single vertical layout (one image per item)
 * - Alternating left/right entry animations based on image.side
 * - Supports unlimited number of images
 */

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Photo from './Photo';
import './Showcase.css';

// Animation variants for images based on entry side
const getImageVariants = (side, reducedMotion = false) => {
  const offsetX = side === 'left' ? -400 : 400;
  const exitX = side === 'left' ? -120 : 120;

  if (reducedMotion) {
    return {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      exit: {
        opacity: 0,
        transition: {
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };
  }

  return {
    hidden: {
      opacity: 0,
      x: offsetX,
      y: 30,
      filter: 'blur(12px)',
      scale: 0.92,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 25,
        mass: 1,
        velocity: 0,
      },
    },
    exit: {
      opacity: 0.2,
      x: exitX,
      y: -15,
      filter: 'blur(6px)',
      scale: 0.95,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };
};

/**
 * ShowcaseImage - Individual image tile
 */
function ShowcaseImage({ image, index, total, reducedMotion }) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 0.35,
    once: false,
  });
  const imageVariants = getImageVariants(image.side || 'left', reducedMotion);

  // Determine aspect ratio based on type or dimensions
  const aspectRatio = image.dimensions?.aspectRatio || 
    (image.type === 'portrait' ? 9 / 14 : image.type === 'square' ? 1 : 16 / 9);
  const isPortrait = image.type === 'portrait' || (aspectRatio < 1);
  const aspectClass = isPortrait ? '' : `aspect-[${aspectRatio}]`;

  // Format EXIF data for display (matching Lightbox)
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const exif = image.exif || {};
  
  // Build camera info line (camera + lens)
  const cameraLine = [exif.camera, exif.lens].filter(Boolean).join('  •  ');
  
  // Build settings line (focal length, aperture, shutter, ISO)
  const settingsLine = [
    exif.focalLength,
    exif.aperture,
    exif.shutterSpeed,
    exif.iso ? `ISO ${exif.iso}` : null
  ].filter(Boolean).join('  •  ');

  const formattedDate = formatDate(exif.dateTaken);
  const location = image.location || null;

  // Check if we have any EXIF data to display (location is handled separately at top)
  const hasExifData = formattedDate || cameraLine || settingsLine;
  
  // Extract filename from src path (fallback to alt or default)
  const filename = image.src 
    ? image.src.split('/').pop().replace(/-large\.webp$/, '').replace(/\.webp$/, '')
    : (image.alt || `Image ${index + 1}`);

  // Derive responsive image paths from src
  const deriveImagePaths = (src) => {
    if (!src) return { src, srcSmall: undefined, srcLarge: undefined };
    
    const isLargeWebp = src.toLowerCase().endsWith('-large.webp');
    const isSmallWebp = src.toLowerCase().endsWith('-small.webp');
    
    if (isLargeWebp) {
      return {
        src: src,
        srcSmall: src.replace(/-large\.webp$/i, '-small.webp'),
        srcLarge: src
      };
    } else if (isSmallWebp) {
      return {
        src: src,
        srcSmall: src,
        srcLarge: src.replace(/-small\.webp$/i, '-large.webp')
      };
    } else {
      // Fallback: assume large format, derive small
      const withoutExt = src.replace(/\.[^/.]+$/i, '');
      return {
        src: src,
        srcSmall: `${withoutExt}-small.webp`,
        srcLarge: src
      };
    }
  };

  const imagePaths = deriveImagePaths(image.src);
  
  // Determine loading strategy - first 2 images load eagerly
  const loadingStrategy = index < 2 ? {
    loading: 'eager',
    fetchPriority: 'high'
  } : {
    loading: 'lazy',
    fetchPriority: undefined
  };

  return (
    <motion.div
      ref={ref}
      className={`showcase-image showcase-image-${image.side || 'left'} ${isPortrait ? 'showcase-image-portrait' : ''}`}
      variants={imageVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'exit'}
      viewport={{ amount: 0.35, once: false }}
      style={isPortrait ? { 
        willChange: 'transform, opacity, filter',
        '--portrait-aspect-ratio': aspectRatio
      } : { willChange: 'transform, opacity, filter' }}
    >
      {/* Location at the top, above a line */}
      {location && (
        <div className="showcase-location-header">
          <div className="showcase-location-name">{location}</div>
          <div className="showcase-location-line"></div>
        </div>
      )}
      
      <motion.div
        className={`showcase-image-wrapper ${aspectClass}`}
      >
        <Photo
          src={imagePaths.src}
          srcSmall={imagePaths.srcSmall}
          srcLarge={imagePaths.srcLarge}
          alt={image.alt || 'Showcase image'}
          className="showcase-image-img"
          loading={loadingStrategy.loading}
          fetchPriority={loadingStrategy.fetchPriority}
          decoding="async"
          width={image.dimensions?.width}
          height={image.dimensions?.height}
          aspectRatio={aspectRatio}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1120px"
        />
        {image.label && (
          <div className="showcase-image-overlay">
            <span className="showcase-image-label">{image.label}</span>
          </div>
        )}
      </motion.div>
      
      {/* EXIF info section below image - matching lightbox styling */}
      {hasExifData && (
        <div className="showcase-exif-info">
          <div className="showcase-exif-header">
            <span className="showcase-exif-filename">{filename}</span>
            <span className="showcase-exif-position">{index + 1} / {total}</span>
          </div>
          <div className="showcase-exif-details">
            {formattedDate && (
              <div className="showcase-exif-line showcase-exif-date">{formattedDate}</div>
            )}
            {cameraLine && (
              <div className="showcase-exif-line showcase-exif-camera">{cameraLine}</div>
            )}
            {settingsLine && (
              <div className="showcase-exif-line showcase-exif-settings">{settingsLine}</div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Showcase - Main component
 */
export default function Showcase() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const reducedMotion = useReducedMotion();

  // Load showcase data from JSON
  useEffect(() => {
    async function loadShowcase() {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}content/site/showcase.json`);
        if (!response.ok) {
          throw new Error(`Failed to load showcase: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const imagesList = Array.isArray(data.images) ? data.images : [];
        
        // Sort images by order field (if provided)
        // Images without order field will maintain their relative order but come after ordered images
        const sortedImages = [...imagesList].sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : Infinity;
          const orderB = b.order !== undefined ? b.order : Infinity;
          return orderA - orderB;
        });
        
        setImages(sortedImages);
      } catch (error) {
        console.error('Error loading showcase data:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    }

    loadShowcase();
  }, []);

  if (loading) {
    return null; // Or a loading placeholder
  }

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <section className="showcase-section">
      <div className="showcase-container">
        <h2 className="showcase-title">SHOWCASE</h2>
        
        <div className="showcase-items-container">
          {images.map((image, index) => (
            <ShowcaseImage
              key={`image-${image.id}`}
              image={image}
              index={index}
              total={images.length}
              reducedMotion={reducedMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
