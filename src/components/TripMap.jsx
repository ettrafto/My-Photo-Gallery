import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import './TripMap.css';

/**
 * Create a marker icon using the custom marker SVG
 */
function createMarkerIcon(size = [28, 35]) {
  const [width, height] = size;
  const iconAnchor = [width / 2, height]; // Center horizontally, anchor at bottom
  const iconUrl = `${import.meta.env.BASE_URL}icons/marker.svg`;
  
  return L.divIcon({
    className: 'trip-map-marker-wrapper',
    html: `<div class="trip-map-marker-inner" style="width: ${width}px; height: ${height}px;"><img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`,
    iconSize: [width, height],
    iconAnchor: iconAnchor,
    popupAnchor: [0, -height],
  });
}

/**
 * TripMap component - displays a STATIC (non-interactive) map with route
 * 
 * This map is intentionally non-interactive - users cannot drag, zoom, or scroll.
 * Programmatic panning from highlights/timeline is still supported via ref methods.
 * This keeps the map as a visual reference while preventing accidental navigation.
 * 
 * @param {Object} props
 * @param {import('../types/trips.jsdoc').TripRoute} props.route - Route information with polyline
 * @param {Array<{slug: string, title: string, primaryLocation: {lat: number, lng: number, name: string}, cover: string, count: number}>} props.albums - Albums to display markers for
 * @param {Function} props.onMapReady - Callback when map is initialized
 * @param {Object} ref - Forwarded ref for external control
 */
const TripMap = forwardRef(({ route, albums = [], onMapReady }, ref) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const albumMarkersRef = useRef([]);

  // Store initial bounds for reset functionality
  const initialBoundsRef = useRef(null);

  // Expose methods to parent via ref for programmatic control
  // (highlights and timeline can still pan the map)
  useImperativeHandle(ref, () => ({
    /**
     * Pan map to a specific location (programmatic only)
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number} [zoom=12] - Zoom level
     */
    panToLocation: (lat, lng, zoom = 12) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], zoom, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    },

    /**
     * Reset map to show full journey (route)
     */
    resetToFullView: () => {
      if (mapInstanceRef.current && initialBoundsRef.current) {
        mapInstanceRef.current.fitBounds(initialBoundsRef.current, { 
          padding: [50, 50], 
          maxZoom: 10,
          duration: 1.5
        });
      }
    }
  }));

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map with ALL interactions disabled for static display
    const map = L.map(mapRef.current, {
      zoomControl: false,         // No zoom buttons
      scrollWheelZoom: false,     // No scroll wheel zoom
      doubleClickZoom: false,     // No double-click zoom
      boxZoom: false,             // No box zoom
      keyboard: false,            // No keyboard controls
      dragging: false,            // No dragging/panning
      touchZoom: false,           // No touch zoom
      tap: false,                 // No tap for mobile
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const bounds = L.latLngBounds();
    let hasValidBounds = false;

    // Draw route polyline if provided
    // Using black dashed line for clear visibility against map tiles
    if (route && route.polyline && route.polyline.length > 0) {
      const polylinePoints = route.polyline.map(point => [point.lat, point.lng]);
      
      const polyline = L.polyline(polylinePoints, {
        color: 'black',
        weight: 3,
        opacity: 0.8,
        smoothFactor: 1,
        dashArray: '6 6'
      }).addTo(map);

      polylineRef.current = polyline;

      // Add route points to bounds
      route.polyline.forEach(point => {
        bounds.extend([point.lat, point.lng]);
        hasValidBounds = true;
      });

      // Optionally add labels for route points
      route.polyline.forEach(point => {
        if (point.label) {
          L.marker([point.lat, point.lng], {
            icon: L.divIcon({
              className: 'trip-route-label',
              html: `<div class="trip-route-label-text">${point.label}</div>`,
              iconSize: [120, 20],
              iconAnchor: [60, -10]
            })
          }).addTo(map);
        }
      });
    }

    // Add album markers with popups
    if (albums && albums.length > 0) {
      // Filter albums with valid locations
      const albumsWithLocations = albums.filter(album => 
        album.primaryLocation && 
        typeof album.primaryLocation.lat === 'number' && 
        typeof album.primaryLocation.lng === 'number'
      );

      if (albumsWithLocations.length > 0) {
        const markerIcon = createMarkerIcon([21, 28]); // 50% smaller: was [28, 35]
        
        albumsWithLocations.forEach((album) => {
          const { lat, lng } = album.primaryLocation;
          const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
          
          // Create popup HTML similar to Map page
          const coverUrl = album.cover ? `${import.meta.env.BASE_URL}${album.cover}` : '';
          const albumUrl = `/album/${album.slug}`;
          
          const popupHtml = `
            <div class="trip-map-popup">
              ${coverUrl ? `
                <div class="trip-map-popup-thumb-wrap">
                  <img src="${coverUrl}" alt="${album.title}" class="trip-map-popup-thumb" />
                </div>
              ` : ''}
              <div class="trip-map-popup-meta">
                <div class="trip-map-popup-album">${album.title}</div>
                ${album.count ? `<div class="trip-map-popup-date">${album.count} photo${album.count !== 1 ? 's' : ''}</div>` : ''}
                <a href="${albumUrl}" class="trip-map-popup-link">view album &rsaquo;</a>
              </div>
            </div>
          `;
          
          marker.bindPopup(popupHtml);
          albumMarkersRef.current.push(marker);
          
          // Add to bounds
          bounds.extend([lat, lng]);
          hasValidBounds = true;
        });
      }
    }

    // Fit map to bounds or use default view
    if (hasValidBounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      // Store initial bounds for reset functionality
      initialBoundsRef.current = bounds;
    } else {
      map.setView([39.8, -98.5], 4);
    }

    // Notify parent that map is ready
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      // Clean up album markers
      albumMarkersRef.current.forEach(marker => marker.remove());
      albumMarkersRef.current = [];
      
      map.remove();
      mapInstanceRef.current = null;
      polylineRef.current = null;
    };
  }, [route, albums, onMapReady]);

  return (
    <div className="trip-map-container">
      <div ref={mapRef} className="trip-map-canvas" />
    </div>
  );
});

TripMap.displayName = 'TripMap';

export default TripMap;

