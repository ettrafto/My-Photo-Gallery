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
  const aspectClass = `aspect-[${aspectRatio}]`;

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

  // Check if we have any EXIF or location data to display
  const hasExifData = formattedDate || cameraLine || settingsLine || location;
  
  // Extract filename from src path (fallback to alt or default)
  const filename = image.src 
    ? image.src.split('/').pop().replace(/-large\.webp$/, '').replace(/\.webp$/, '')
    : (image.alt || `Image ${index + 1}`);

  return (
    <motion.div
      ref={ref}
      className={`showcase-image showcase-image-${image.side || 'left'}`}
      variants={imageVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'exit'}
      viewport={{ amount: 0.35, once: false }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      <motion.div
        className={`showcase-image-wrapper ${aspectClass}`}
      >
        <img
          src={image.src}
          alt={image.alt || 'Showcase image'}
          className="showcase-image-img"
          loading="lazy"
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
            {location && (
              <div className="showcase-exif-line showcase-exif-location">{location}</div>
            )}
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
