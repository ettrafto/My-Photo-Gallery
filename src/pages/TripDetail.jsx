import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import TripMap from '../components/TripMap';
import TripHighlightsCarousel from '../components/TripHighlightsCarousel';
import TripTimeline from '../components/TripTimeline';
import TripGallery from '../components/TripGallery';
import TripMedia from '../components/TripMedia';
import './TripDetail.css';

/**
 * TripDetail page - displays comprehensive information about a single trip
 * 
 * KEY BEHAVIORS:
 * - Section order: Hero → Summary → Highlights → Map → Timeline → Destination Photos → Media
 * - Timeline shows "destinations" (route points + highlights with GPS)
 * - Photos are filtered by selected destination (not by album)
 * - Map is non-interactive (no user dragging/zooming)
 * - Timeline clicks pan the map and load destination photos
 */
export default function TripDetail() {
  const { slug } = useParams();
  const mapRef = useRef(null);
  const carouselRef = useRef(null);

  // Data state
  const [trip, setTrip] = useState(null);
  const [tripPhotos, setTripPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state for interactions
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  
  // NEW: Destination-based photo viewing
  // When user clicks a timeline destination, we show only photos near that destination
  const [selectedDestinationId, setSelectedDestinationId] = useState(null);
  const [selectedDestinationPhotos, setSelectedDestinationPhotos] = useState([]);
  
  // View mode: 'destination' (filtered) or 'all' (show all photos by album)
  const [viewMode, setViewMode] = useState('prompt'); // 'prompt', 'destination', 'all'

  // Load trip data and photos
  useEffect(() => {
    async function loadTripData() {
      setLoading(true);
      setError(null);

      try {
        // Load trip JSON
        const tripResponse = await fetch(`${import.meta.env.BASE_URL}content/trips/${slug}.json`);
        if (!tripResponse.ok) throw new Error(`Trip not found: ${slug}`);
        const tripData = await tripResponse.json();
        setTrip(tripData);

        // Load map.json to get all photos
        const mapResponse = await fetch(`${import.meta.env.BASE_URL}content/map.json`);
        if (!mapResponse.ok) throw new Error('Failed to load photo index');
        const mapData = await mapResponse.json();

        // Filter photos that belong to this trip's albums
        const tripAlbumSlugs = new Set(tripData.albumIds);
        const filteredPhotos = mapData.photos.filter(photo => 
          tripAlbumSlugs.has(photo.albumSlug) &&
          typeof photo.lat === 'number' && 
          typeof photo.lng === 'number'
        );

        setTripPhotos(filteredPhotos);
        console.log(`📸 Loaded ${filteredPhotos.length} geotagged photos for trip: ${slug}`);
      } catch (err) {
        console.error('Failed to load trip:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadTripData();
    }
  }, [slug]);

  /**
   * Build destinations array from route polyline + highlights with GPS
   * 
   * Destinations represent points along the trip that can be:
   * 1. Route waypoints from trip.route.polyline (cities, parks, stops)
   * 2. Highlight moments that have GPS coordinates
   * 
   * CHRONOLOGICAL ORDERING:
   * - Highlights have explicit dates
   * - Route points get inferred dates based on their position in the journey
   * - All destinations are sorted chronologically for the timeline
   */
  const buildDestinations = () => {
    if (!trip) return [];

    const destinations = [];
    const startDate = new Date(trip.dateStart);
    const endDate = new Date(trip.dateEnd);
    const tripDurationMs = endDate - startDate;

    // Add route polyline points as destinations with inferred dates
    if (trip.route && trip.route.polyline && trip.route.polyline.length > 0) {
      const routePointCount = trip.route.polyline.length;
      
      trip.route.polyline.forEach((point, index) => {
        // Infer date based on position in route
        // First point = trip start, last point = trip end, interpolate in between
        let inferredDate;
        if (routePointCount === 1) {
          inferredDate = startDate;
        } else {
          const progress = index / (routePointCount - 1); // 0.0 to 1.0
          const dateMs = startDate.getTime() + (tripDurationMs * progress);
          inferredDate = new Date(dateMs);
        }

        destinations.push({
          id: `route-${index}`,
          label: point.label || `Point ${index + 1}`,
          lat: point.lat,
          lng: point.lng,
          type: 'route-point',
          date: inferredDate.toISOString().split('T')[0], // YYYY-MM-DD format
          dateInferred: true, // Flag to indicate this is an inferred date
          sortIndex: index
        });
      });
    }

    // Add highlights with GPS as destinations (they have explicit dates)
    if (trip.highlights && trip.highlights.length > 0) {
      trip.highlights
        .filter(h => typeof h.mapLat === 'number' && typeof h.mapLng === 'number')
        .forEach((highlight, index) => {
          destinations.push({
            id: highlight.id,
            label: highlight.title,
            lat: highlight.mapLat,
            lng: highlight.mapLng,
            type: 'highlight',
            date: highlight.date,
            dateInferred: false, // Explicit date from highlight data
            description: highlight.description,
            image: highlight.image,
            albumSlug: highlight.albumSlug,
            photoFilename: highlight.photoFilename,
            sortIndex: 1000 + index
          });
        });
    }

    // Sort all destinations chronologically by date
    return destinations.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      const dateDiff = dateA - dateB;
      
      // If dates are the same, preserve original order (route points before highlights)
      if (dateDiff === 0) {
        return a.sortIndex - b.sortIndex;
      }
      
      return dateDiff;
    });
  };

  const destinations = buildDestinations();

  /**
   * Filter photos near a destination using haversine distance
   * 
   * PHOTO MATCHING LOGIC:
   * 1. If highlight has albumSlug + photoFilename, match that specific photo
   * 2. Otherwise, find all photos within DISTANCE_THRESHOLD of destination
   * 
   * Distance threshold: 10km (configurable)
   */
  const DISTANCE_THRESHOLD_KM = 10;

  const getDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getPhotosForDestination = (destination) => {
    if (!destination || !tripPhotos) return [];

    // Strategy 1: Direct photo match (for highlights with specific photo references)
    if (destination.type === 'highlight' && destination.albumSlug && destination.photoFilename) {
      const directMatch = tripPhotos.find(
        p => p.albumSlug === destination.albumSlug && p.filename === destination.photoFilename
      );
      if (directMatch) {
        return [directMatch];
      }
    }

    // Strategy 2: Geographic proximity search
    const nearbyPhotos = tripPhotos.filter(photo => {
      if (typeof photo.lat !== 'number' || typeof photo.lng !== 'number') return false;
      const distance = getDistanceKm(destination.lat, destination.lng, photo.lat, photo.lng);
      return distance <= DISTANCE_THRESHOLD_KM;
    });

    // Sort by distance (closest first)
    return nearbyPhotos.sort((a, b) => {
      const distA = getDistanceKm(destination.lat, destination.lng, a.lat, a.lng);
      const distB = getDistanceKm(destination.lat, destination.lng, b.lat, b.lng);
      return distA - distB;
    });
  };

  // NOTE: We do NOT auto-select a destination on load
  // The map shows the full journey overview until user clicks a timeline destination
  // This gives users context of the entire trip before diving into specific locations

  // Calculate trip statistics
  const getTripStats = () => {
    if (!trip) return null;

    const startDate = new Date(trip.dateStart);
    const endDate = new Date(trip.dateEnd);
    const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    return {
      duration: durationDays,
      photoCount: tripPhotos.length,
      albumCount: trip.albumIds.length,
      highlightCount: trip.highlights ? trip.highlights.length : 0
    };
  };

  const stats = getTripStats();

  // Format date range
  const formatDateRange = () => {
    if (!trip) return '';
    const start = new Date(trip.dateStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const end = new Date(trip.dateEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${start} – ${end}`;
  };

  // Interaction handlers
  const handleHighlightHover = (highlight) => {
    if (highlight.mapLat && highlight.mapLng && mapRef.current) {
      // Pan map to highlight location on hover (regional view)
      mapRef.current.panToLocation(highlight.mapLat, highlight.mapLng, 6);
    }
  };

  const handleHighlightClick = (highlight) => {
    setActiveHighlightId(highlight.id);
    if (highlight.mapLat && highlight.mapLng && mapRef.current) {
      // Pan map to highlight location on click (regional view)
      mapRef.current.panToLocation(highlight.mapLat, highlight.mapLng, 6);
    }
  };

  /**
   * Handle timeline destination click
   * 
   * When user clicks a destination in the timeline:
   * 1. Pan the map to that location
   * 2. Update selected destination state
   * 3. Load photos for that destination
   * 
   * Zoom level 6 provides regional context (not too close)
   */
  const handleDestinationClick = (destination) => {
    // Update selected destination
    setSelectedDestinationId(destination.id);
    setViewMode('destination');
    
    // Load photos for this destination
    const photos = getPhotosForDestination(destination);
    setSelectedDestinationPhotos(photos);
    
    // Pan map to destination with regional zoom (zoom level 6)
    if (destination.lat && destination.lng && mapRef.current) {
      mapRef.current.panToLocation(destination.lat, destination.lng, 6);
    }

    // If this is a highlight destination, also sync the carousel
    if (destination.type === 'highlight') {
      setActiveHighlightId(destination.id);
      if (carouselRef.current) {
        carouselRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  /**
   * Show all photos organized by album
   * Resets map to show full journey view
   */
  const handleShowAllPhotos = () => {
    setViewMode('all');
    setSelectedDestinationId(null);
    setSelectedDestinationPhotos([]);
    
    // Reset map to show full journey
    if (mapRef.current) {
      mapRef.current.resetToFullView();
    }
  };

  // Determine cover image
  const getCoverImage = () => {
    if (trip?.coverImage) {
      return `${import.meta.env.BASE_URL}${trip.coverImage}`;
    }
    if (trip?.useFirstAlbumCoverIfMissing && tripPhotos.length > 0) {
      return `${import.meta.env.BASE_URL}${tripPhotos[0].path}`;
    }
    return null;
  };

  const coverImageUrl = getCoverImage();

  // Loading state
  if (loading) {
    return (
      <main className="page-shell">
        <section className="page-block">
          <p className="trip-detail-loading">Loading trip...</p>
        </section>
      </main>
    );
  }

  // Error state
  if (error || !trip) {
    return (
      <main className="page-shell">
        <section className="page-block">
          <p className="trip-detail-error">
            {error || 'Trip not found'}
          </p>
          <Link to="/trips" className="trip-detail-back-link">
            ← Back to all trips
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="trip-detail-page">
      {/* Hero Section */}
      <section className="trip-hero">
        {coverImageUrl && (
          <div className="trip-hero-image">
            <img src={coverImageUrl} alt={trip.title} />
          </div>
        )}
        <div className="trip-hero-overlay">
          <div className="trip-hero-content">
            <Link to="/trips" className="trip-hero-back">← All Trips</Link>
            <h1 className="trip-hero-title">{trip.title}</h1>
          </div>
        </div>
      </section>

      <div className="trip-detail-content">
        {/* Summary Bar */}
        <section className="page-block trip-summary-bar">
          <div className="trip-summary-meta">
            <div className="trip-summary-dates">{formatDateRange()}</div>
            {trip.region && <div className="trip-summary-region">{trip.region}</div>}
          </div>

          {trip.summary && (
            <p className="trip-summary-text">{trip.summary}</p>
          )}

          {stats && (
            <div className="trip-summary-stats">
              <div className="trip-stat">
                <span className="trip-stat-value">{stats.duration}</span>
                <span className="trip-stat-label">days</span>
              </div>
              <div className="trip-stat">
                <span className="trip-stat-value">{stats.photoCount}</span>
                <span className="trip-stat-label">photos</span>
              </div>
              <div className="trip-stat">
                <span className="trip-stat-value">{stats.albumCount}</span>
                <span className="trip-stat-label">albums</span>
              </div>
              {stats.highlightCount > 0 && (
                <div className="trip-stat">
                  <span className="trip-stat-value">{stats.highlightCount}</span>
                  <span className="trip-stat-label">highlights</span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Highlights Carousel - Shows above map */}
        {trip.highlights && trip.highlights.length > 0 && (
          <section className="page-block" ref={carouselRef}>
            <TripHighlightsCarousel
              highlights={trip.highlights}
              onHighlightHover={handleHighlightHover}
              onHighlightClick={handleHighlightClick}
              activeHighlightId={activeHighlightId}
            />
          </section>
        )}

        {/* Map Section - Non-interactive, shows trip route and markers */}
        {tripPhotos.length > 0 && (
          <section className="page-block">
            <p className="page-label">route</p>
            <h2 className="page-title">Trip Map</h2>
            <TripMap
              ref={mapRef}
              tripPhotos={tripPhotos}
              route={trip.route}
            />
          </section>
        )}

        {/* Timeline - Destinations (route points + highlights), directly under map */}
        {destinations.length > 0 && (
          <section className="page-block">
            <TripTimeline
              destinations={destinations}
              onItemClick={handleDestinationClick}
              selectedDestinationId={selectedDestinationId}
              viewMode={viewMode}
              onShowAllClick={handleShowAllPhotos}
            />
          </section>
        )}

        {/* Photos Section - Three modes: prompt, destination-filtered, or all by album */}
        {destinations.length > 0 && (
          <section className="page-block">
            <div className="destination-photos">
              {/* Mode 1: Prompt - No destination selected yet */}
              {viewMode === 'prompt' && (
                <div className="destination-photos-prompt">
                  <div className="destination-photos-prompt-icon">📍</div>
                  <h3 className="destination-photos-prompt-title">Select a Destination</h3>
                  <p className="destination-photos-prompt-text">
                    Click any destination in the timeline above to view photos from that location.
                  </p>
                  <div className="destination-photos-prompt-stats">
                    <span>{destinations.length} destinations</span>
                    <span>·</span>
                    <span>{tripPhotos.length} total photos</span>
                  </div>
                  <button className="destination-photos-prompt-btn" onClick={handleShowAllPhotos}>
                    Or view all photos by album →
                  </button>
                </div>
              )}

              {/* Mode 2: Destination - Filtered photos for selected destination */}
              {viewMode === 'destination' && selectedDestinationId && (
                <>
                  <div className="destination-photos-header">
                    <h3 className="destination-photos-title">
                      Photos from {destinations.find(d => d.id === selectedDestinationId)?.label || 'this location'}
                    </h3>
                    <div className="destination-photos-count">
                      {selectedDestinationPhotos.length} photo{selectedDestinationPhotos.length !== 1 ? 's' : ''}
                      {selectedDestinationPhotos.length > 0 && (
                        <span className="destination-photos-hint"> within {DISTANCE_THRESHOLD_KM}km</span>
                      )}
                    </div>
                  </div>

                  {selectedDestinationPhotos.length > 0 ? (
                    <div className="destination-photos-grid">
                      {selectedDestinationPhotos.map((photo) => {
                        const photoUrl = `${import.meta.env.BASE_URL}${photo.path}`;
                        const distance = getDistanceKm(
                          destinations.find(d => d.id === selectedDestinationId)?.lat || 0,
                          destinations.find(d => d.id === selectedDestinationId)?.lng || 0,
                          photo.lat,
                          photo.lng
                        );

                        return (
                          <div key={photo.filename} className="destination-photo-item">
                            <img
                              src={photoUrl}
                              alt={photo.filename}
                              className="destination-photo-image"
                              loading="lazy"
                            />
                            <div className="destination-photo-overlay">
                              <div className="destination-photo-info">
                                <span className="destination-photo-album">{photo.albumTitle}</span>
                                <span className="destination-photo-distance">{distance.toFixed(1)}km away</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="destination-photos-empty">
                      <p>No photos found within {DISTANCE_THRESHOLD_KM}km of this destination.</p>
                      <p className="destination-photos-empty-hint">
                        Try selecting a different destination from the timeline, or view all photos.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Mode 3: All Photos - Organized by album */}
              {viewMode === 'all' && (
                <TripGallery tripPhotos={tripPhotos} albumSlugs={trip.albumIds} />
              )}
            </div>
          </section>
        )}

        {/* Supplemental Media */}
        {trip.media && trip.media.length > 0 && (
          <section className="page-block">
            <TripMedia mediaItems={trip.media} />
          </section>
        )}

        {/* Misc Images (Behind the Scenes) */}
        {trip.miscImages && trip.miscImages.length > 0 && (
          <section className="page-block">
            <h3 className="page-title">Behind the Scenes</h3>
            <div className="trip-misc-images">
              {trip.miscImages.map((img, index) => (
                <div key={index} className="trip-misc-image">
                  <img src={`${import.meta.env.BASE_URL}${img.src}`} alt={img.caption || ''} />
                  {img.caption && <p className="trip-misc-caption">{img.caption}</p>}
                  {img.tags && img.tags.length > 0 && (
                    <div className="trip-misc-tags">
                      {img.tags.map(tag => (
                        <span key={tag} className="trip-misc-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

