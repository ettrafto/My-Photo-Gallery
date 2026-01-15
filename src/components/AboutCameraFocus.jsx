import { useRef, useEffect } from 'react';
import { motion, useScroll, useMotionValue, useTransform, useVelocity, useSpring, useMotionTemplate } from 'framer-motion';
import './AboutCameraFocus.css';

/**
 * AboutCameraFocus - Retro camera viewfinder component with scroll-driven focus pulse
 * 
 * Features:
 * - Circular camera "screen/lens" with portrait image
 * - Scroll-driven blur animation (blur decreases toward middle, increases at edges)
 * - Subtle pulse effect while scrolling
 * - Retro camera overlay (focus brackets, center dot, exposure scale, ISO/shutter/aperture readouts)
 * - Vignette effect
 * - Minimal camera body silhouette
 * - Responsive: stacks vertically on mobile
 * 
 * @param {Object} props
 * @param {string} props.imageSrc - Path to portrait image
 * @param {string} props.title - H1 title text
 * @param {string} [props.subtitle] - H2 subtitle text (optional)
 * @param {string} [props.body] - P body text (optional)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function AboutCameraFocus({
  imageSrc,
  title,
  subtitle,
  body,
  className = ''
}) {
  const containerRef = useRef(null);
  const time = useMotionValue(0);
  const windowScrollY = useMotionValue(0); // Track window scroll position
  
  // Track window scroll position
  useEffect(() => {
    const updateScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      windowScrollY.set(scrollY);
    };
    
    updateScroll(); // Set initial value
    window.addEventListener('scroll', updateScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', updateScroll);
    };
  }, [windowScrollY]);
  
  // Initial blur override: starts at max blur, transitions to exactly 0 over 1 second
  const initialBlur = useMotionValue(8); // Start at max blur
  const initialBlurSpring = useSpring(initialBlur, { 
    damping: 25, 
    stiffness: 200,
    restDelta: 0.001 // Ensure it reaches exactly 0
  });
  
  // Log initial blur changes
  useEffect(() => {
    const unsubscribe = initialBlurSpring.on('change', (value) => {
      console.log('[AboutCameraFocus] Initial blur spring:', value.toFixed(3));
    });
    return unsubscribe;
  }, [initialBlurSpring]);
  
  // Animate initial blur from max to exactly 0 over 1 second
  useEffect(() => {
    console.log('[AboutCameraFocus] Component mounted, starting initial blur fade');
    const timer = setTimeout(() => {
      console.log('[AboutCameraFocus] Setting initial blur to 0 after 1 second');
      initialBlur.set(0); // Transition to completely unblurred (0px)
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initialBlur]);
  
  // Scroll progress: 0 at start, 1 at end of component viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  
  // Log scroll progress changes
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (value) => {
      console.log('[AboutCameraFocus] Scroll progress:', value.toFixed(3));
    });
    return unsubscribe;
  }, [scrollYProgress]);

  // Track scroll velocity for pulse effect
  const scrollVelocity = useVelocity(scrollYProgress);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });

  // Triangle function: 0 at edges, 1 at middle
  // We want blur to be max at edges, min at middle (inverse of triangle)
  const triangle = useTransform(scrollYProgress, (p) => {
    return 1 - Math.abs(2 * p - 1);
  });

  // Base blur: max at edges (8px), min at middle (0.75px)
  const maxBlur = 8;
  const minBlur = 0.75;
  const scrollBlur = useTransform(triangle, (t) => {
    return minBlur + (maxBlur - minBlur) * (1 - t);
  });
  
  // Combine initial blur (fades out) with scroll-driven blur
  // Initial blur starts at maxBlur and fades to exactly 0 over 1 second
  // After initial blur fades, scroll blur takes over, but at top/bottom edges it should be 0
  const baseBlur = useTransform([initialBlurSpring, scrollBlur, scrollYProgress, windowScrollY], ([initial, scroll, progress, scrollY]) => {
    // During initial fade (first 1 second), use initial blur
    if (initial > 0.01) { // Small threshold to handle floating point precision
      return initial;
    }
    
    // After initial fade: if page is at top (user hasn't scrolled), always use 0 blur
    // This ensures the image is sharp when the page first loads and user is at the top
    if (scrollY < 10) {
      console.log('[AboutCameraFocus] At top of page - using 0 blur:', {
        progress: progress.toFixed(3),
        scroll: scroll.toFixed(3),
        scrollY: scrollY.toFixed(1)
      });
      return 0;
    }
    
    // After initial fade: check if we're at the edges of the component's scroll range
    // At the very top (progress ≈ 0) or bottom (progress ≈ 1), use 0 blur for sharpness
    // Also check if scroll blur is at maximum (8px), which indicates we're at the edge
    if (progress <= 0.02 || progress >= 0.98 || scroll >= maxBlur - 0.5) {
      console.log('[AboutCameraFocus] At component edge - using 0 blur:', {
        progress: progress.toFixed(3),
        scroll: scroll.toFixed(3),
        maxBlur
      });
      return 0;
    }
    
    // Otherwise, use scroll blur (which has min blur of 0.75px for retro feel)
    console.log('[AboutCameraFocus] Using scroll blur:', {
      progress: progress.toFixed(3),
      scroll: scroll.toFixed(3),
      scrollY: scrollY.toFixed(1)
    });
    return scroll;
  });

  // Pulse amplitude based on scroll velocity
  const pulseAmplitude = useTransform(smoothVelocity, (v) => {
    const absV = Math.abs(v);
    // Clamp amplitude: 0 to 0.6px
    return Math.min(absV * 15, 0.6);
  });

  // Animate time for pulse wave
  useEffect(() => {
    let animationFrameId;
    let startTime = performance.now();
    
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000; // Convert to seconds
      time.set(elapsed * 2); // frequency = 2
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [time]);

  // Pulse wave: sin(time * frequency)
  const pulse = useTransform([pulseAmplitude, time], ([amp, t]) => {
    return amp * Math.sin(t);
  });

  // Final blur = base blur + pulse
  const finalBlur = useTransform([baseBlur, pulse], ([base, pulse]) => {
    return base + pulse;
  });

  // Use useMotionTemplate for filter style
  const filter = useMotionTemplate`blur(${finalBlur}px)`;

  // Normalize image path
  const normalizedImageSrc = imageSrc?.startsWith('/') 
    ? imageSrc 
    : `/${imageSrc}`;
  const baseUrl = (import.meta.env.BASE_URL || '').replace(/\/$/, '');
  const fullImageSrc = `${baseUrl}${normalizedImageSrc}`;

  return (
    <section 
      ref={containerRef}
      className={`about-camera-focus ${className}`}
    >
      <div className="about-camera-focus-container">
        {/* Left: Camera View */}
        <div className="about-camera-view">
          {/* Circular Viewport */}
          <div className="camera-viewport">
            {/* Image with scroll-driven blur */}
            <motion.img
              src={fullImageSrc}
              alt="Portrait"
              className="camera-image"
              style={{
                filter,
                willChange: 'filter'
              }}
            />

            {/* Vignette Overlay */}
            <div className="camera-vignette" aria-hidden="true"></div>

            {/* Camera Overlay UI */}
            <div className="camera-overlay" aria-hidden="true">
              {/* Focus Brackets (4 corners) */}
              <div className="focus-bracket focus-bracket-tl"></div>
              <div className="focus-bracket focus-bracket-tr"></div>
              <div className="focus-bracket focus-bracket-bl"></div>
              <div className="focus-bracket focus-bracket-br"></div>

              {/* Center Dot/Crosshair */}
              <div className="center-crosshair">
                <div className="crosshair-dot"></div>
                <div className="crosshair-line crosshair-line-h"></div>
                <div className="crosshair-line crosshair-line-v"></div>
              </div>

              {/* Exposure Scale Strip (right side) */}
              <div className="exposure-scale">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="exposure-tick"></div>
                ))}
              </div>

              {/* Camera Readouts */}
              <div className="camera-readouts">
                <div className="readout readout-iso">ISO 400</div>
                <div className="readout readout-shutter">1/125</div>
                <div className="readout readout-aperture">f/2.8</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Text Content */}
        <div className="about-camera-text">
          {title && <h1 className="about-camera-title">{title}</h1>}
          {subtitle && <h2 className="about-camera-subtitle">{subtitle}</h2>}
          {body && <p className="about-camera-body">{body}</p>}
        </div>
      </div>
    </section>
  );
}
