import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import L from 'leaflet';
import './TripMap.css';

/**
 * TripMap component - displays a STATIC (non-interactive) map with trip photos and route
 * 
 * This map is intentionally non-interactive - users cannot drag, zoom, or scroll.
 * Programmatic panning from highlights/timeline is still supported via ref methods.
 * This keeps the map as a visual reference while preventing accidental navigation.
 * 
 * @param {Object} props
 * @param {import('../types/trips.jsdoc').Photo[]} props.tripPhotos - Photos to display on map
 * @param {import('../types/trips.jsdoc').TripRoute} props.route - Route information with polyline
 * @param {Function} props.onMapReady - Callback when map is initialized
 * @param {Object} ref - Forwarded ref for external control
 */
const TripMap = forwardRef(({ tripPhotos, route, onMapReady }, ref) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

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
     * Reset map to show full journey (all markers + route)
     */
    resetToFullView: () => {
      if (mapInstanceRef.current && initialBoundsRef.current) {
        mapInstanceRef.current.fitBounds(initialBoundsRef.current, { 
          padding: [50, 50], 
          maxZoom: 10,
          duration: 1.5
        });
      }
    },

    /**
     * Highlight a specific marker by photo path
     * @param {string} photoPath - Path to photo to highlight
     */
    highlightMarker: (photoPath) => {
      const marker = markersRef.current.find(m => m.photoPath === photoPath);
      if (marker) {
        marker.leafletMarker.openPopup();
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

    // Custom dark marker icon (reuse existing)
    const customIcon = L.icon({
      iconUrl: `${import.meta.env.BASE_URL}icons/marker.svg`,
      iconSize: [32, 40],
      iconAnchor: [16, 40],
      popupAnchor: [0, -40],
      shadowUrl: null,
    });

    const bounds = L.latLngBounds();
    let hasValidBounds = false;

    // Add photo markers
    if (tripPhotos && tripPhotos.length > 0) {
      tripPhotos.forEach((photo) => {
        if (typeof photo.lat !== 'number' || typeof photo.lng !== 'number') return;

        const marker = L.marker([photo.lat, photo.lng], { icon: customIcon }).addTo(map);
        const thumbUrl = `${import.meta.env.BASE_URL}${photo.path}`;

        const popupHtml = `
          <div class="trip-map-popup">
            <div class="trip-map-popup-thumb">
              <img src="${thumbUrl}" alt="${photo.filename}" />
            </div>
            <div class="trip-map-popup-meta">
              <div class="trip-map-popup-album">${photo.albumTitle}</div>
              ${photo.dateTaken ? `<div class="trip-map-popup-date">${String(photo.dateTaken).slice(0, 10)}</div>` : ''}
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        
        markersRef.current.push({
          photoPath: photo.path,
          leafletMarker: marker
        });

        bounds.extend([photo.lat, photo.lng]);
        hasValidBounds = true;
      });
    }

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
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
      polylineRef.current = null;
    };
  }, [tripPhotos, route, onMapReady]);

  return (
    <div className="trip-map-container">
      <div ref={mapRef} className="trip-map-canvas" />
    </div>
  );
});

TripMap.displayName = 'TripMap';

export default TripMap;

