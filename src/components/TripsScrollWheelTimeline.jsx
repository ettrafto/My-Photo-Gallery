import { useState, useEffect, useRef, useCallback } from 'react';
import './TripsScrollWheelTimeline.css';

/**
 * TripsScrollWheelTimeline - Dynamic scroll wheel timeline positioned on the right edge
 * 
 * BEHAVIOR:
 * - Vertically stacked destinations on the right side
 * - Active destination enlarges based on scroll position
 * - Clicking a destination scrolls to its corresponding section and updates selection
 * - Uses IntersectionObserver to track which section is in view
 * 
 * @param {Object} props
 * @param {Array} props.destinations - Array of destination objects
 * @param {Function} props.onItemClick - Callback when clicking a destination
 * @param {string} props.selectedDestinationId - Currently selected destination ID
 * @param {string} props.activeAlbumSlug - Currently active album slug (for syncing)
 * @param {Function} props.onShowAllClick - Callback for "Show Full Journey" button
 * @param {Object} props.sectionRefs - Refs to main content sections for scrollspy
 */
export default function TripsScrollWheelTimeline({
  destinations,
  onItemClick,
  selectedDestinationId,
  activeAlbumSlug,
  onShowAllClick,
  sectionRefs = {}
}) {
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef(null);
  const itemRefs = useRef([]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  /**
   * Calculate which destination should be active based on scroll position
   * Uses a combination of:
   * 1. Selected destination ID (from timeline click or album activation)
   * 2. Scroll progress through the page (proportional mapping)
   */
  useEffect(() => {
    if (!destinations || destinations.length === 0) return;

    // If a destination is explicitly selected, that's active
    if (selectedDestinationId) {
      const selectedIndex = destinations.findIndex(d => d.id === selectedDestinationId);
      if (selectedIndex !== -1) {
        setActiveDestinationIndex(selectedIndex);
        return;
      }
    }

    // Otherwise, use scroll position to determine active destination
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Calculate scroll progress (0 to 1)
      const maxScroll = documentHeight - windowHeight;
      const progress = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollProgress(progress);

      // Map scroll progress to destination index
      // Distribute destinations across the scrollable content
      // Reserve top 30% for hero/summary/highlights, bottom 20% for media
      // Middle 50% maps to destinations
      const startThreshold = 0.3;
      const endThreshold = 0.8;
      
      if (progress < startThreshold) {
        // Before destinations section
        setActiveDestinationIndex(0);
      } else if (progress > endThreshold) {
        // After destinations section
        setActiveDestinationIndex(destinations.length - 1);
      } else {
        // Map progress to destination index
        const mappedProgress = (progress - startThreshold) / (endThreshold - startThreshold);
        const index = Math.floor(mappedProgress * destinations.length);
        const clampedIndex = Math.min(index, destinations.length - 1);
        setActiveDestinationIndex(clampedIndex);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [destinations, selectedDestinationId]);

  /**
   * Handle clicking a destination item
   * Scrolls to the photos section and triggers selection
   */
  const handleDestinationClick = useCallback((destination, index) => {
    // Trigger the selection handler
    if (onItemClick) {
      onItemClick(destination);
    }

    // Scroll handled by parent component (TripDetail) which scrolls to album section
  }, [onItemClick, sectionRefs]);

  if (!destinations || destinations.length === 0) {
    return null;
  }

  return (
    <aside className="trips-scrollwheel-timeline" ref={timelineRef}>
      <div className="trips-scrollwheel-track">
        {destinations.map((destination, index) => {
          const isSelected = destination.id === selectedDestinationId;
          const isActive = activeDestinationIndex === index;
          const isRoutePoint = destination.type === 'route-point';
          const isHighlight = destination.type === 'highlight';

          // Calculate scale based on distance from active index
          let scale = 0.7; // Base scale for inactive items
          let opacity = 0.5;
          
          if (isActive || isSelected) {
            scale = 1.2;
            opacity = 1;
          } else {
            // Gradual scaling based on distance from active
            const distance = Math.abs(index - activeDestinationIndex);
            if (activeDestinationIndex !== null) {
              scale = Math.max(0.7, 1.2 - (distance * 0.15));
              opacity = Math.max(0.3, 1 - (distance * 0.2));
            }
          }

          return (
            <div
              key={destination.id}
              ref={el => itemRefs.current[index] = el}
              className={`trips-scrollwheel-item ${isActive ? 'trips-scrollwheel-item-active' : ''} ${isSelected ? 'trips-scrollwheel-item-selected' : ''} ${isRoutePoint ? 'trips-scrollwheel-item-route' : 'trips-scrollwheel-item-highlight'}`}
              style={{
                transform: `scale(${scale})`,
                opacity: opacity,
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out'
              }}
              onClick={() => handleDestinationClick(destination, index)}
              onMouseEnter={(e) => {
                if (!isActive && !isSelected) {
                  e.currentTarget.style.transform = `scale(${scale * 1.1})`;
                  e.currentTarget.style.opacity = Math.min(1, opacity + 0.2);
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive && !isSelected) {
                  e.currentTarget.style.transform = `scale(${scale})`;
                  e.currentTarget.style.opacity = opacity;
                }
              }}
            >
              <div className="trips-scrollwheel-dot">
                {isRoutePoint ? '📍' : '⭐'}
              </div>
              
              {index < destinations.length - 1 && (
                <div className="trips-scrollwheel-line" />
              )}
              
              <div className="trips-scrollwheel-label">
                {destination.label}
              </div>
              
              {destination.date && (
                <div className="trips-scrollwheel-date">
                  {formatDate(destination.date)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show Full Journey button */}
      <div className="trips-scrollwheel-actions">
        <button
          className={`trips-scrollwheel-view-all-btn ${!activeAlbumSlug && !selectedDestinationId ? 'trips-scrollwheel-view-all-btn-active' : ''}`}
          onClick={onShowAllClick}
          title="Reset map and view all photos by album"
        >
          <span className="trips-scrollwheel-btn-icon">🗺️</span>
          <span className="trips-scrollwheel-btn-text">Full Journey</span>
        </button>
      </div>
    </aside>
  );
}

