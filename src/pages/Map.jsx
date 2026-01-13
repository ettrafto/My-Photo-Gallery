import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import './Map.css';

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * @returns distance in kilometers
 */
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]); // Store markers for dynamic scaling
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map viewport state for proximity calculations
  const [mapCenter, setMapCenter] = useState(null); // { lat, lng }
  const [mapBounds, setMapBounds] = useState(null); // L.LatLngBounds
  const [albumsByProximity, setAlbumsByProximity] = useState([]);
  
  // Track which album is currently being hovered
  const [hoveredAlbumSlug, setHoveredAlbumSlug] = useState(null);
  
  /**
   * Calculate marker icon size based on zoom level
   * Smaller at low zoom (world view), scales up as zoom increases
   * Uses a gentler scaling curve (square root) for less drastic changes
   */
  const getMarkerIconSize = (zoom) => {
    // Base size at low zoom (world view, zoom ~2-4)
    const baseSize = 20; // Smaller base size
    const baseHeight = 25;
    
    // Max size at high zoom (street level, zoom ~15+)
    const maxSize = 32;
    const maxHeight = 40;
    
    // Use square root scaling for gentler curve
    // Zoom range: typically 1-19, but we focus on 2-15 range
    const minZoom = 2;
    const maxZoom = 15;
    
    // Clamp zoom to our scaling range
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    
    // Normalize zoom to 0-1 range
    const normalized = (clampedZoom - minZoom) / (maxZoom - minZoom);
    
    // Square root scaling for gentler curve
    const scale = Math.sqrt(normalized);
    
    // Interpolate between base and max sizes
    const width = baseSize + (maxSize - baseSize) * scale;
    const height = baseHeight + (maxHeight - baseHeight) * scale;
    
    return [Math.round(width), Math.round(height)];
  };
  
  /**
   * Create a marker icon with specified size
   * Using divIcon with wrapper div so we can scale the inner content without affecting Leaflet's positioning
   */
  const createMarkerIcon = (size) => {
    const [width, height] = size;
    const iconAnchor = [width / 2, height]; // Center horizontally, anchor at bottom
    
    // Use divIcon with a wrapper div - this allows us to scale the inner img without moving the marker
    const iconUrl = `${import.meta.env.BASE_URL}icons/marker.svg`;
    
    return L.divIcon({
      className: 'map-marker-wrapper', // Class for the wrapper div
      html: `<div class="map-marker-inner" style="width: ${width}px; height: ${height}px;"><img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`,
      iconSize: [width, height],
      iconAnchor: iconAnchor,
      popupAnchor: [0, -height],
    });
  };
  
  /**
   * Update all marker sizes based on current zoom level
   */
  const updateMarkerSizes = (zoom) => {
    const newSize = getMarkerIconSize(zoom);
    const newIcon = createMarkerIcon(newSize);
    
    markersRef.current.forEach(({ marker, album }) => {
      marker.setIcon(newIcon);
      // Reapply hover effect if this marker is currently hovered
      if (hoveredAlbumSlug === album.slug) {
        highlightMarker(marker);
      }
    });
  };
  
  /**
   * Highlight a marker with glow and scale effect
   * Now using divIcon wrapper, so we scale the inner div instead of the outer container
   */
  const highlightMarker = (marker) => {
    const element = marker.getElement();
    if (!element) return;
    
    // With divIcon, the element is the wrapper div, and we need to find the inner div
    const innerDiv = element.querySelector('.map-marker-inner');
    if (!innerDiv) {
      // Fallback: if divIcon structure isn't found, use direct transform (for backward compatibility)
      const scale = 1.25;
      element.style.transformOrigin = 'center center';
      element.style.transform = `scale(${scale})`;
      element.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))';
      element.style.transition = 'transform 0.2s ease-out, filter 0.2s ease-out';
      element.style.zIndex = '1000';
      return;
    }
    
    const scale = 1.25;
    
    // Scale the inner div from center - this won't affect Leaflet's positioning of the wrapper
    innerDiv.style.transformOrigin = 'center center';
    innerDiv.style.transform = `scale(${scale})`;
    innerDiv.style.filter = 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))';
    innerDiv.style.transition = 'transform 0.2s ease-out, filter 0.2s ease-out';
    element.style.zIndex = '1000';
  };
  
  /**
   * Remove highlight from a marker
   */
  const unhighlightMarker = (marker) => {
    const element = marker.getElement();
    if (!element) return;
    
    const innerDiv = element.querySelector('.map-marker-inner');
    if (innerDiv) {
      // Using divIcon wrapper - remove styles from inner div
      innerDiv.style.transform = '';
      innerDiv.style.transformOrigin = '';
      innerDiv.style.filter = '';
      innerDiv.style.transition = '';
      element.style.zIndex = '';
    } else {
      // Fallback: remove styles from element directly (for backward compatibility)
      element.style.transform = '';
      element.style.transformOrigin = '';
      element.style.filter = '';
      element.style.transition = '';
      element.style.zIndex = '';
    }
  };
  
  /**
   * Handle album hover from the list
   */
  const handleAlbumHover = (albumSlug) => {
    setHoveredAlbumSlug(albumSlug);
    
    // Find and highlight the corresponding marker
    const markerEntry = markersRef.current.find(({ album }) => album.slug === albumSlug);
    if (markerEntry) {
      highlightMarker(markerEntry.marker);
    }
  };
  
  /**
   * Handle album hover end
   */
  const handleAlbumHoverEnd = () => {
    if (hoveredAlbumSlug) {
      const markerEntry = markersRef.current.find(({ album }) => album.slug === hoveredAlbumSlug);
      if (markerEntry) {
        unhighlightMarker(markerEntry.marker);
      }
    }
    setHoveredAlbumSlug(null);
  };

  // Load albums with geo data
  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}content/albums.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        // Filter albums to only those with valid primaryLocation coordinates
        const albumsWithGeo = (data.albums || []).filter(album => 
          album.primaryLocation &&
          typeof album.primaryLocation.lat === 'number' &&
          typeof album.primaryLocation.lng === 'number' &&
          !isNaN(album.primaryLocation.lat) &&
          !isNaN(album.primaryLocation.lng)
        );
        
        setAlbums(albumsWithGeo);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load albums:', err);
        setError('Could not load album data');
        setLoading(false);
      });
  }, []);

  // Compute album proximity when map center/bounds change
  useEffect(() => {
    if (!mapCenter || !mapBounds || !albums.length) {
      setAlbumsByProximity([]);
      return;
    }

    // Filter albums within current map bounds
    const visibleAlbums = albums.filter(album => {
      const { lat, lng } = album.primaryLocation;
      return mapBounds.contains([lat, lng]);
    });


    if (visibleAlbums.length === 0) {
      setAlbumsByProximity([]);
      return;
    }

    // Calculate distance for each visible album and sort by proximity
    const albumsWithDistance = visibleAlbums.map(album => {
      const { lat, lng } = album.primaryLocation;
      const distance = getDistanceKm(mapCenter.lat, mapCenter.lng, lat, lng);
      
      return {
        albumSlug: album.slug,
        albumTitle: album.title,
        minDistance: distance,
        photoCount: album.count || 0,
        cover: album.cover,
        coverAspectRatio: album.coverAspectRatio || 1.5
      };
    });

    // Sort by proximity (closest first)
    const sortedAlbums = albumsWithDistance.sort((a, b) => a.minDistance - b.minDistance);

    
    setAlbumsByProximity(sortedAlbums);
  }, [mapCenter, mapBounds, albums]);

  // Initialize Leaflet once data is ready
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || loading || error) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    if (!albums.length) {
      // Default view (continental US-ish) if nothing to show
      map.setView([37.5, -96], 4);
      
      // Set initial center and bounds even if no albums
      const center = map.getCenter();
      setMapCenter({ lat: center.lat, lng: center.lng });
      setMapBounds(map.getBounds());
      return;
    }

    // Track map movement for album proximity updates
    // Using 'moveend' to avoid excessive updates during pan/zoom
    const handleMoveEnd = () => {
      const newCenter = map.getCenter();
      const newBounds = map.getBounds();
      
      setMapCenter({ lat: newCenter.lat, lng: newCenter.lng });
      setMapBounds(newBounds);
    };

    // Track zoom changes to update marker sizes
    const handleZoomEnd = () => {
      const zoom = map.getZoom();
      updateMarkerSizes(zoom);
    };

    // Create markers - we'll update icon sizes after view is set
    // Start with a reasonable default icon size
    const defaultZoom = 4;
    const defaultIcon = createMarkerIcon(getMarkerIconSize(defaultZoom));
    
    markersRef.current = [];
    albums.forEach((album) => {
      const { lat, lng } = album.primaryLocation;
      
      const marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
      
      // Add hover effects to the marker
      marker.on('mouseover', () => {
        highlightMarker(marker);
      });
      
      marker.on('mouseout', () => {
        // Only unhighlight if not currently hovered from the list
        if (hoveredAlbumSlug !== album.slug) {
          unhighlightMarker(marker);
        }
      });
      
      const coverUrl = `${import.meta.env.BASE_URL}${album.cover}`;
      const albumUrl = `/album/${album.slug}`;

      const popupHtml = `
        <div class="map-popup">
          <div class="map-popup-thumb-wrap">
            <img src="${coverUrl}" alt="${album.title}" class="map-popup-thumb" />
          </div>
          <div class="map-popup-meta">
            <div class="map-popup-album">${album.title}</div>
            ${album.count ? `<div class="map-popup-date">${album.count} photo${album.count !== 1 ? 's' : ''}</div>` : ''}
            <a href="${albumUrl}" class="map-popup-link">view album &rsaquo;</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersRef.current.push({ marker, album });
    });

    // Track map movement for album proximity updates
    map.on('moveend', handleMoveEnd);
    
    // Track zoom changes to update marker sizes (handles both user zoom and initial fitBounds)
    map.on('zoomend', handleZoomEnd);

    // Fit map to show all album markers, or default to continental US
    if (albums.length > 0) {
      const bounds = L.latLngBounds(
        albums.map(album => [album.primaryLocation.lat, album.primaryLocation.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
      
      // Update marker sizes after fitBounds completes (zoomend will also fire)
      // Use a small delay to ensure fitBounds animation completes
      setTimeout(() => {
        const zoom = map.getZoom();
        updateMarkerSizes(zoom);
      }, 100);
    } else {
      map.setView([39.8, -98.5], 4);
      updateMarkerSizes(4);
    }

    // Set initial center and bounds
    const center = map.getCenter();
    setMapCenter({ lat: center.lat, lng: center.lng });
    setMapBounds(map.getBounds());

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleZoomEnd);
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, [albums, loading, error]);

  const statusText = error
    ? 'ERROR LOADING ALBUM DATA'
    : loading
    ? 'LOADING ALBUMS...'
    : albums.length === 0
    ? 'NO ALBUMS WITH GEO DATA FOUND'
    : `${albums.length} ALBUM${albums.length === 1 ? '' : 'S'} WITH LOCATION DATA`;

  return (
    <main className="page-shell map-page-shell">
      <section className="page-block">
        <p className="page-label">map</p>
        <h1 className="page-title">Geo index</h1>
        <p className="page-body">
          Live index of albums with location data. Albums with GPS coordinates appear as markers on the map.
        </p>
      </section>

      <section className="page-block map-layout-container">
        <div className="map-layout-left">
          <div className="map-container">
            <div ref={mapRef} className="map-canvas" />
          </div>
          <div className="map-status">{statusText}</div>
        </div>
        
        <div className="map-layout-right">
          {/* Album Proximity Panel - shows albums sorted by distance from map center */}
          {mapCenter && albumsByProximity.length > 0 && (
            <div className="albums-panel">
              <p className="page-label">nearby albums</p>
              <h2 className="page-title">Albums in view</h2>
              <p className="page-body proximity-coords">
                Map center: {mapCenter.lat.toFixed(3)}°, {mapCenter.lng.toFixed(3)}°
              </p>
              
              <ul className="album-proximity-list">
                {albumsByProximity.map((album) => (
                  <li 
                    key={album.albumSlug} 
                    className="proximity-album-item"
                    onMouseEnter={() => handleAlbumHover(album.albumSlug)}
                    onMouseLeave={handleAlbumHoverEnd}
                  >
                    <a href={`/album/${album.albumSlug}`} className="proximity-album-link">
                      <div className="proximity-album-header">
                        <span className="proximity-album-title">{album.albumTitle}</span>
                        <span className="proximity-album-distance">
                          {album.minDistance < 1 
                            ? `${(album.minDistance * 1000).toFixed(0)}m` 
                            : `${album.minDistance.toFixed(1)}km`}
                        </span>
                      </div>
                      <div className="proximity-album-meta">
                        <span className="proximity-photo-count">
                          {album.photoCount} photo{album.photoCount !== 1 ? 's' : ''}
                        </span>
                        <span className="proximity-album-slug">/{album.albumSlug}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mapCenter && albumsByProximity.length === 0 && !loading && albums.length > 0 && (
            <div className="albums-panel">
              <p className="page-label">nearby albums</p>
              <h2 className="page-title">No albums in view</h2>
              <p className="page-body">
                Pan or zoom the map to show album markers, and nearby albums will appear here.
              </p>
            </div>
          )}

          {!mapCenter && !loading && (
            <div className="albums-panel">
              <p className="page-label">nearby albums</p>
              <h2 className="page-title">Albums in view</h2>
              <p className="page-body">
                The map is loading. Albums visible in the current view will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
