import { motion } from 'framer-motion';
import { useState } from 'react';
import './Hero.css';

/**
 * Hero - Full-width hero section blending Data-Driven Photographer and Dynamic Depth Grid styles
 * Features floating diagonal image cluster, animated grid background, and retro EXIF overlays
 * 
 * @param {Object} props
 * @param {Array<{url: string, exif: string, alt: string, orientation: 'portrait'|'landscape'|'square'}>} props.images - Array of 5 feature images
 * @param {string} props.headline - Main hero headline
 * @param {string} props.subheadline - Hero subheadline
 */
export default function Hero({ 
  images = defaultImages, 
  headline = "Capturing Light Across Time",
  subheadline = "Photography by Evan Trafton"
}) {
  const [hoveredImage, setHoveredImage] = useState(null);
  const [tappedImage, setTappedImage] = useState(null);

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
          <p className="hero-subheadline">{subheadline}</p>
        </motion.div>

        {/* Right Image Cluster */}
        <div className="hero-images">
          {images.map((image, index) => (
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
                />
                
                {/* Retro EXIF Overlay */}
                <div className={`hero-exif-overlay ${hoveredImage === index || tappedImage === index ? 'active' : ''}`}>
                  <span className="hero-exif-text">{image.exif}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
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

