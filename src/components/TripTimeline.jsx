import './TripTimeline.css';

/**
 * TripTimeline - displays trip destinations in a horizontal scrollable timeline
 * 
 * DESTINATIONS:
 * - Destinations are derived from route polyline points + highlights with GPS
 * - Each destination is clickable and pans the map + loads destination photos
 * - Timeline is directly under the map (not sticky/floating)
 * 
 * @param {Object} props
 * @param {Array} props.destinations - Array of destination objects (route points + highlights)
 * @param {Function} props.onItemClick - Callback when clicking a destination
 * @param {string} props.selectedDestinationId - Currently selected destination ID
 * @param {string} props.viewMode - Current view mode ('prompt', 'destination', 'all')
 * @param {Function} props.onShowAllClick - Callback when "Show Full Journey" button is clicked
 */
export default function TripTimeline({ 
  destinations, 
  onItemClick, 
  selectedDestinationId,
  viewMode,
  onShowAllClick
}) {
  if (!destinations || destinations.length === 0) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="trip-timeline">
      <div className="trip-timeline-header">
        <div className="trip-timeline-header-left">
          <h3 className="trip-timeline-title">Trip Destinations</h3>
          <div className="trip-timeline-count">
            {destinations.length} stop{destinations.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Show Full Journey button */}
        <button 
          className={`trip-timeline-view-all-btn ${viewMode === 'all' ? 'trip-timeline-view-all-btn-active' : ''}`}
          onClick={onShowAllClick}
          title="Reset map and view all photos by album"
        >
          <span className="trip-timeline-btn-icon">🗺️</span>
          <span className="trip-timeline-btn-text">Show Full Journey</span>
        </button>
      </div>
      
      <div className="trip-timeline-scroll-container">
        <div className="trip-timeline-track">
          {destinations.map((destination, index) => {
            const isSelected = destination.id === selectedDestinationId;
            const isRoutePoint = destination.type === 'route-point';
            const isHighlight = destination.type === 'highlight';

            return (
              <div
                key={destination.id}
                className={`trip-timeline-item ${isSelected ? 'trip-timeline-item-selected' : ''} ${isRoutePoint ? 'trip-timeline-item-route' : 'trip-timeline-item-highlight'}`}
                onClick={() => onItemClick && onItemClick(destination)}
              >
                <div className="trip-timeline-dot">
                  {isRoutePoint ? '📍' : '⭐'}
                </div>
                
                {index < destinations.length - 1 && (
                  <div className="trip-timeline-line" />
                )}
                
                <div className="trip-timeline-content">
                  <div className="trip-timeline-label">{destination.label}</div>
                  
                  {destination.date && (
                    <div className="trip-timeline-date">{formatDate(destination.date)}</div>
                  )}
                  
                  {destination.type === 'route-point' && (
                    <div className="trip-timeline-type">Waypoint</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="trip-timeline-hint">
        Click a destination to view photos from that location
      </div>
    </div>
  );
}

