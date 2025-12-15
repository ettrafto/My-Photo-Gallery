import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import TripMap from '../components/TripMap';
import TripHighlightsCarousel from '../components/TripHighlightsCarousel';
import TripsScrollWheelTimeline from '../components/TripsScrollWheelTimeline';
import TripAlbumsSections from '../components/TripAlbumsSections';
import TripMedia from '../components/TripMedia';
import LazyImage from '../components/LazyImage';
import Lightbox from '../components/Lightbox';
import './TripDetail.css';

/**
 * TripDetail page - displays comprehensive information about a single trip
 * 
 * KEY BEHAVIORS:
 * - Section order: Hero → Summary → Highlights → Map → Albums → Media
 * - All albums displayed simultaneously with scroll-based activation
 * - Active album transitions in/out based on scroll position
 * - Timeline shows route points (destinations) on right edge
 * - Timeline syncs with active album - clicking destination scrolls to album section
 * - Map displays full route statically (no transformations/panning)
 * - Map is non-interactive (no user dragging/zooming)
 */
export default function TripDetail() {
  const { slug } = useParams();
  const mapRef = useRef(null);
  const mapSectionRef = useRef(null);
  const carouselRef = useRef(null);
  const photosRef = useRef(null);

  // Data state
  const [trip, setTrip] = useState(null);
  const [tripPhotos, setTripPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state for interactions
  const [activeHighlightId, setActiveHighlightId] = useState(null);
  
  // Active album state - replaces viewMode/selectedDestinationId
  const [activeAlbumSlug, setActiveAlbumSlug] = useState(null);
  
  // Lightbox state for photo viewing (like AlbumPage)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

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
   * Build albums array from trip data
   * Groups photos by album and maintains trip.albumIds order
   */
  const albums = useMemo(() => {
    if (!trip || !tripPhotos || !trip.albumIds) return [];

    return trip.albumIds.map(albumSlug => {
      const albumPhotos = tripPhotos.filter(photo => photo.albumSlug === albumSlug);
      
      // Sort photos by date taken
      const sortedPhotos = albumPhotos.sort((a, b) => {
        const dateA = a.dateTaken ? new Date(a.dateTaken) : new Date(0);
        const dateB = b.dateTaken ? new Date(b.dateTaken) : new Date(0);
        return dateA - dateB;
      });

      // Get album title from first photo
      const albumTitle = albumPhotos[0]?.albumTitle || albumSlug;

      return {
        slug: albumSlug,
        title: albumTitle,
        photos: sortedPhotos
      };
    });
  }, [trip, tripPhotos]);

  /**
   * All trip photos sorted chronologically for lightbox navigation
   */
  const sortedTripPhotos = useMemo(() => {
    if (!tripPhotos || tripPhotos.length === 0) return [];
    return [...tripPhotos].sort((a, b) => {
      const dateA = a.dateTaken ? new Date(a.dateTaken) : new Date(0);
      const dateB = b.dateTaken ? new Date(b.dateTaken) : new Date(0);
      return dateA - dateB;
    });
  }, [tripPhotos]);

  /**
   * Handle photo click - open lightbox with all trip photos
   */
  const handlePhotoClick = useCallback((photo, indexInAlbum, indexInTrip) => {
    // Find the photo's index in the sorted trip photos array
    const photoIndex = sortedTripPhotos.findIndex(p => p.filename === photo.filename);
    if (photoIndex !== -1) {
      setSelectedPhotoIndex(photoIndex);
    } else {
      // Fallback: use the provided indexInTrip if photo not found
      setSelectedPhotoIndex(indexInTrip);
    }
  }, [sortedTripPhotos]);

  /**
   * Map album slug to destination ID
   * Route points and albums have 1:1 correspondence by index
   */
  const getDestinationIdForAlbum = useCallback((albumSlug) => {
    if (!trip || !destinations) return null;
    const albumIndex = trip.albumIds.indexOf(albumSlug);
    if (albumIndex === -1) return null;
    // Find route point destination at this index
    const routePointDestinations = destinations.filter(d => d.type === 'route-point');
    return routePointDestinations[albumIndex]?.id || null;
  }, [trip, destinations]);

  /**
   * Map destination ID to album slug
   */
  const getAlbumSlugForDestination = useCallback((destinationId) => {
    if (!trip || !destinations) return null;
    const routePointDestinations = destinations.filter(d => d.type === 'route-point');
    const destinationIndex = routePointDestinations.findIndex(d => d.id === destinationId);
    if (destinationIndex === -1) return null;
    return trip.albumIds[destinationIndex] || null;
  }, [trip, destinations]);

  /**
   * Derived: active destination ID from active album
   */
  const activeDestinationId = useMemo(() => {
    if (!activeAlbumSlug) return null;
    return getDestinationIdForAlbum(activeAlbumSlug);
  }, [activeAlbumSlug, getDestinationIdForAlbum]);

  /**
   * Map transformations removed - map now shows full route statically
   */

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
    // Map transformations removed - map shows full route statically
  };

  const handleHighlightClick = (highlight) => {
    setActiveHighlightId(highlight.id);
    // Map transformations removed - map shows full route statically
  };

  /**
   * Handle timeline destination click
   * 
   * When user clicks a destination in the timeline:
   * 1. Find corresponding album slug
   * 2. Set active album and scroll to section
   * Map transformations removed - map shows full route statically
   */
  const handleDestinationClick = useCallback((destination) => {
    const albumSlug = getAlbumSlugForDestination(destination.id);
    if (!albumSlug) return;
    
    // Set active album
    setActiveAlbumSlug(albumSlug);
    
    // Scroll to album section
    const albumSection = document.querySelector(`[data-album-slug="${albumSlug}"]`);
    if (albumSection) {
      albumSection.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [getAlbumSlugForDestination]);

  /**
   * Handle album activation from scroll
   * Called when scroll tracking detects a new active album
   */
  const handleAlbumActivate = useCallback((albumSlug) => {
    setActiveAlbumSlug(albumSlug);
  }, []);

  /**
   * Show full journey - reset to show all albums equally
   * Map transformations removed - map shows full route statically
   */
  const handleShowAllPhotos = useCallback(() => {
    setActiveAlbumSlug(null);
  }, []);

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
          <section className="page-block" ref={mapSectionRef}>
            <p className="page-label">route</p>
            <h2 className="page-title">Trip Map</h2>
            <TripMap
              ref={mapRef}
              tripPhotos={tripPhotos}
              route={trip.route}
            />
          </section>
        )}

        {/* Albums Section - All albums displayed with scroll-based activation */}
        {albums.length > 0 && (
          <section className="page-block" ref={photosRef}>
            <div className="trip-albums-container">
              <div className="trip-albums-header">
                <h3 className="trip-albums-title">Trip Albums</h3>
                <div className="trip-albums-count">
                  {albums.length} album{albums.length !== 1 ? 's' : ''} · {tripPhotos.length} photo{tripPhotos.length !== 1 ? 's' : ''}
                </div>
              </div>
              <TripAlbumsSections
                albums={albums}
                activeAlbumSlug={activeAlbumSlug}
                onAlbumActivate={handleAlbumActivate}
                onPhotoClick={handlePhotoClick}
                totalTripPhotos={sortedTripPhotos.length}
              />
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
                  <LazyImage 
                    src={`${import.meta.env.BASE_URL}${img.src}`} 
                    alt={img.caption || 'Behind the scenes'}
                    className="trip-misc-image-photo"
                    threshold={0.01}
                    rootMargin="100px"
                  />
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

      {/* Scroll Wheel Timeline - Fixed on right edge */}
      {/* Filter out highlights - only show route points */}
      {destinations.length > 0 && (() => {
        const routePointDestinations = destinations.filter(d => d.type === 'route-point');
        return routePointDestinations.length > 0 ? (
          <TripsScrollWheelTimeline
            destinations={routePointDestinations}
            onItemClick={handleDestinationClick}
            selectedDestinationId={activeDestinationId}
            activeAlbumSlug={activeAlbumSlug}
            onShowAllClick={handleShowAllPhotos}
            sectionRefs={{
              photosRef: photosRef,
              carouselRef: carouselRef,
              mapRef: mapRef,
              mapSectionRef: mapSectionRef
            }}
          />
        ) : null;
      })()}

      {/* Lightbox for viewing photos (like AlbumPage) */}
      {selectedPhotoIndex !== null && sortedTripPhotos.length > 0 && (
        <Lightbox
          photos={sortedTripPhotos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </main>
  );
}

