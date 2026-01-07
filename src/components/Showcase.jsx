import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import './Showcase.css';

// Default/fallback data (used if config fails to load)
// Updated to support 12 images
const defaultImageTiles = [
  { id: 1, type: 'landscape', side: 'left', src: 'https://picsum.photos/seed/showcase1/1600/900', alt: 'Landscape 1', label: null },
  { id: 2, type: 'portrait', side: 'right', src: 'https://picsum.photos/seed/showcase2/900/1400', alt: 'Portrait 1', label: null },
  { id: 3, type: 'landscape', side: 'left', src: 'https://picsum.photos/seed/showcase3/1600/900', alt: 'Landscape 2', label: null },
  { id: 4, type: 'square', side: 'right', src: 'https://picsum.photos/seed/showcase4/1200/1200', alt: 'Square 1', label: null },
  { id: 5, type: 'landscape', side: 'left', src: 'https://picsum.photos/seed/showcase5/1600/900', alt: 'Landscape 3', label: null },
  { id: 6, type: 'landscape', side: 'right', src: 'https://picsum.photos/seed/showcase6/1600/900', alt: 'Landscape 4', label: null },
  { id: 7, type: 'portrait', side: 'left', src: 'https://picsum.photos/seed/showcase7/900/1400', alt: 'Portrait 2', label: null },
  { id: 8, type: 'square', side: 'right', src: 'https://picsum.photos/seed/showcase8/1200/1200', alt: 'Square 2', label: null },
  { id: 9, type: 'landscape', side: 'left', src: 'https://picsum.photos/seed/showcase9/1600/900', alt: 'Landscape 5', label: null },
  { id: 10, type: 'landscape', side: 'right', src: 'https://picsum.photos/seed/showcase10/1600/900', alt: 'Landscape 6', label: null },
  { id: 11, type: 'landscape', side: 'left', src: 'https://picsum.photos/seed/showcase11/1600/900', alt: 'Landscape 7', label: null },
  { id: 12, type: 'landscape', side: 'right', src: 'https://picsum.photos/seed/showcase12/1600/900', alt: 'Landscape 8', label: null },
];

const defaultTextCallouts = [
  { id: 'callout1', text: 'Costa Brava', position: 'before', targetId: 1 },
  { id: 'callout2', text: 'Bryce Canyon', position: 'after', targetId: 2 },
  { id: 'callout3', text: 'Arches', position: 'before', targetId: 4 },
  { id: 'callout4', text: 'Zion', position: 'after', targetId: 5 },
  { id: 'callout5', text: 'Acadia', position: 'before', targetId: 7 },
  { id: 'callout6', text: 'White Mountains', position: 'after', targetId: 9 },
];

// Animation variants for tiles based on side
const getTileVariants = (side) => {
  const offsetX = side === 'left' ? -400 : 400;
  const exitX = side === 'left' ? -120 : 120;
  
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

// Callout animation variants
const calloutVariants = {
  hidden: {
    opacity: 0,
    y: 15,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0.2,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

/**
 * ScrollTile component - Individual image tile with scroll-driven animation
 */
function ScrollTile({ tile, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    amount: 0.25, 
    once: false 
  });

  const variants = getTileVariants(tile.side);
  // Use src from config if available, otherwise fallback to placeholder
  const imageUrl = tile.src || `https://picsum.photos/seed/showcase${tile.id}/1600/900`;

  return (
    <motion.div
      ref={ref}
      className={`showcase-tile showcase-tile-${tile.side} showcase-tile-${tile.type}`}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'exit'}
      viewport={{ amount: 0.25, once: false }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      <motion.div
        className="showcase-image-wrapper"
        whileHover={{ 
          scale: 1.02, 
          filter: 'contrast(1.08) brightness(1.03)',
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <img
          src={imageUrl}
          alt={tile.alt || `Showcase image ${tile.id}`}
          className="showcase-image"
          loading="lazy"
        />
        {tile.label && (
          <div className="showcase-overlay">
            <span className="showcase-label">{tile.label}</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * Callout component - Text label with scroll animation
 */
function Callout({ callout }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    amount: 0.3, 
    once: false 
  });

  return (
    <motion.div
      ref={ref}
      className="showcase-callout"
      variants={calloutVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'exit'}
      viewport={{ amount: 0.3, once: false }}
    >
      <span className="showcase-callout-text">{callout.text}</span>
    </motion.div>
  );
}

/**
 * Showcase component - Scroll-driven image showcase
 */
export default function Showcase() {
  const [imageTiles, setImageTiles] = useState(defaultImageTiles);
  const [textCallouts, setTextCallouts] = useState(defaultTextCallouts);
  const [isLoading, setIsLoading] = useState(true);

  // Load showcase configuration
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/site/showcase.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.images && Array.isArray(data.images)) {
          setImageTiles(data.images);
        }
        if (data.callouts && Array.isArray(data.callouts)) {
          setTextCallouts(data.callouts);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Failed to load showcase config, using defaults:', err);
        setIsLoading(false);
        // Keep default values
      });
  }, []);

  // Build ordered content array (images + callouts)
  const content = [];
  let imageIndex = 0;

  imageTiles.forEach((tile, idx) => {
    // Add callout before image if specified
    const calloutBefore = textCallouts.find(
      c => c.targetId === tile.id && c.position === 'before'
    );
    if (calloutBefore) {
      content.push({ type: 'callout', data: calloutBefore });
    }

    // Add image
    content.push({ type: 'image', data: tile, index: imageIndex++ });

    // Add callout after image if specified
    const calloutAfter = textCallouts.find(
      c => c.targetId === tile.id && c.position === 'after'
    );
    if (calloutAfter) {
      content.push({ type: 'callout', data: calloutAfter });
    }
  });

  return (
    <section className="showcase-scroll">
      <div className="showcase-scroll-container">
        <h2 className="showcase-scroll-title">SHOWCASE</h2>
        
        <div className="showcase-scroll-content">
          {content.map((item, idx) => {
            if (item.type === 'image') {
              return (
                <ScrollTile 
                  key={`tile-${item.data.id}`} 
                  tile={item.data} 
                  index={item.index}
                />
              );
            } else {
              return (
                <Callout 
                  key={`callout-${item.data.id}`} 
                  callout={item.data}
                />
              );
            }
          })}
        </div>
      </div>
    </section>
  );
}
