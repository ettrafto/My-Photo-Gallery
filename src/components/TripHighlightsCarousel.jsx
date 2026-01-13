import { useState, useRef, useEffect } from 'react';
import Photo from './Photo';
import './TripHighlightsCarousel.css';

/**
 * TripHighlightsCarousel - displays trip highlights in a carousel format
 * @param {Object} props
 * @param {import('../types/trips.jsdoc').TripHighlight[]} props.highlights - Array of highlights
 * @param {Function} props.onHighlightHover - Callback when hovering a highlight
 * @param {Function} props.onHighlightClick - Callback when clicking a highlight
 * @param {string} props.activeHighlightId - Currently active highlight ID
 */
export default function TripHighlightsCarousel({
  highlights,
  onHighlightHover,
  onHighlightClick,
  activeHighlightId
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);
  const slideRefs = useRef([]);

  if (!highlights || highlights.length === 0) {
    return null;
  }

  const goToSlide = (index) => {
    const boundedIndex = Math.max(0, Math.min(index, highlights.length - 1));
    setCurrentIndex(boundedIndex);
    
    // Scroll to the slide
    if (slideRefs.current[boundedIndex]) {
      slideRefs.current[boundedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  const goToNext = () => {
    if (currentIndex < highlights.length - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      goToSlide(currentIndex - 1);
    }
  };

  const handleHighlightInteraction = (highlight) => {
    if (highlight.mapLat && highlight.mapLng) {
      if (onHighlightClick) {
        onHighlightClick(highlight);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  // Sync with activeHighlightId
  useEffect(() => {
    if (activeHighlightId) {
      const index = highlights.findIndex(h => h.id === activeHighlightId);
      if (index !== -1 && index !== currentIndex) {
        goToSlide(index);
      }
    }
  }, [activeHighlightId]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="highlights-carousel">
      <div className="highlights-carousel-header">
        <h3 className="highlights-carousel-title">Trip Highlights</h3>
        <div className="highlights-carousel-counter">
          {currentIndex + 1} / {highlights.length}
        </div>
      </div>

      <div className="highlights-carousel-wrapper">
        <button
          className="highlights-carousel-btn highlights-carousel-btn-prev"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          aria-label="Previous highlight"
        >
          ‹
        </button>
        
        <div className="highlights-carousel-container" ref={carouselRef}>
          <div className="highlights-carousel-track">
            {highlights.map((highlight, index) => (
              <div
                key={highlight.id}
                ref={el => slideRefs.current[index] = el}
                className={`highlights-slide ${index === currentIndex ? 'highlights-slide-active' : ''} ${highlight.id === activeHighlightId ? 'highlights-slide-highlighted' : ''}`}
                onClick={() => {
                  goToSlide(index);
                  handleHighlightInteraction(highlight);
                }}
                onMouseEnter={() => onHighlightHover && onHighlightHover(highlight)}
              >
                {highlight.image && (
                  <div className="highlights-slide-image">
                    <Photo 
                      src={`${import.meta.env.BASE_URL}${highlight.image}`} 
                      alt={highlight.title}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 50vw"
                    />
                  </div>
                )}
                {!highlight.image && (
                  <div className="highlights-slide-placeholder">
                    <span>Photo from {highlight.albumSlug}</span>
                  </div>
                )}
                
                <div className="highlights-slide-content">
                  <div className="highlights-slide-date">{formatDate(highlight.date)}</div>
                  <h4 className="highlights-slide-title">{highlight.title}</h4>
                  <p className="highlights-slide-description">{highlight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="highlights-carousel-btn highlights-carousel-btn-next"
          onClick={goToNext}
          disabled={currentIndex === highlights.length - 1}
          aria-label="Next highlight"
        >
          ›
        </button>
      </div>

      <div className="highlights-carousel-dots">
        {highlights.map((_, index) => (
          <button
            key={index}
            className={`highlights-dot ${index === currentIndex ? 'highlights-dot-active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to highlight ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

