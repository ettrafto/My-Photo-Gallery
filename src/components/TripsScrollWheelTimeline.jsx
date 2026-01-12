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
  const [isVisible, setIsVisible] = useState(false);
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
   * Detect when map section reaches top of viewport to trigger timeline entrance/exit
   * Timeline appears when map's top edge reaches/passes viewport top
   * Timeline disappears when scrolling back above map (map's top edge is above viewport top)
   */
  useEffect(() => {
    const mapSection = sectionRefs.mapSectionRef?.current;
    if (!mapSection) return;

    // Check initial state
    const checkVisibility = () => {
      const rect = mapSection.getBoundingClientRect();
      return rect.top <= 0;
    };

    // Set initial visibility
    setIsVisible(checkVisibility());

    // Use scroll listener to detect when map reaches/passes top
    const handleScroll = () => {
      const rect = mapSection.getBoundingClientRect();
      // Timeline visible when map's top edge is at or below viewport top
      setIsVisible(rect.top <= 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sectionRefs]);

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
    <aside className={`trips-scrollwheel-timeline ${isVisible ? 'trips-scrollwheel-timeline-visible' : ''}`} ref={timelineRef}>
      <div className="trips-scrollwheel-track">
        {destinations.map((destination, index) => {
          const isSelected = destination.id === selectedDestinationId;
          const isActive = activeDestinationIndex === index;
          const isRoutePoint = destination.type === 'route-point';
          const isHighlight = destination.type === 'highlight';
          const isAlbum = !destination.type; // Items without type are albums

          // Calculate scale based on distance from active index
          let scale = 0.6; // Base scale for inactive items (reduced for more compression)
          let opacity = 0.4;
          
          if (isActive || isSelected) {
            // Exaggerated growth for active destination
            scale = 1.8;
            opacity = 1;
          } else if (activeDestinationIndex !== null) {
            const distance = Math.abs(index - activeDestinationIndex);
            
            // Adjacent destinations (immediately before/after active) get slightly larger scale
            if (distance === 1) {
              scale = 0.85;
              opacity = 0.65;
            } else {
              // Gradual scaling for other destinations based on distance
              scale = Math.max(0.6, 0.85 - ((distance - 1) * 0.08));
              opacity = Math.max(0.25, 0.65 - ((distance - 1) * 0.15));
            }
          }

          // Determine emoji based on type
          let emoji = '⭐'; // Default for highlights
          if (isRoutePoint) {
            emoji = '📍';
          } else if (isAlbum) {
            emoji = null; // No emoji for albums
          }

          return (
            <div
              key={destination.id}
              ref={el => itemRefs.current[index] = el}
              className={`trips-scrollwheel-item ${isActive ? 'trips-scrollwheel-item-active' : ''} ${isSelected ? 'trips-scrollwheel-item-selected' : ''} ${isRoutePoint ? 'trips-scrollwheel-item-route' : isHighlight ? 'trips-scrollwheel-item-highlight' : 'trips-scrollwheel-item-album'}`}
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
              <div className="trips-scrollwheel-content">
                <div className="trips-scrollwheel-name-row">
                  {emoji && (
                    <span className="trips-scrollwheel-emoji">
                      {emoji}
                    </span>
                  )}
                  <span className="trips-scrollwheel-label">
                    {destination.label}
                  </span>
                </div>
                
                {destination.date && (
                  <div className="trips-scrollwheel-date">
                    {formatDate(destination.date)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

