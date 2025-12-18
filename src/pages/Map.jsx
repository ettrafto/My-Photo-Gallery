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
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map viewport state for proximity calculations
  const [mapCenter, setMapCenter] = useState(null); // { lat, lng }
  const [mapBounds, setMapBounds] = useState(null); // L.LatLngBounds
  const [albumsByProximity, setAlbumsByProximity] = useState([]);

  // Load geotagged photos
  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}content/map.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPhotos(data.photos || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load map index:', err);
        setError('Could not load map data');
        setLoading(false);
      });
  }, []);

  // Compute album proximity when map center/bounds change
  useEffect(() => {
    if (!mapCenter || !mapBounds || !photos.length) {
      setAlbumsByProximity([]);
      return;
    }

    console.log('🗺️  Computing album proximity for center:', mapCenter);

    // Filter photos within current map bounds
    const visiblePhotos = photos.filter(photo => {
      if (typeof photo.lat !== 'number' || typeof photo.lng !== 'number') return false;
      return mapBounds.contains([photo.lat, photo.lng]);
    });

    console.log(`📍 ${visiblePhotos.length} of ${photos.length} photos visible in bounds`);

    if (visiblePhotos.length === 0) {
      setAlbumsByProximity([]);
      return;
    }

    // Group visible photos by album and compute distance
    const albumMap = new Map();
    
    visiblePhotos.forEach(photo => {
      const { albumSlug, albumTitle, lat, lng } = photo;
      
      // Calculate distance from map center to this photo
      const distance = getDistanceKm(mapCenter.lat, mapCenter.lng, lat, lng);
      
      if (!albumMap.has(albumSlug)) {
        albumMap.set(albumSlug, {
          albumSlug,
          albumTitle,
          minDistance: distance,
          visiblePhotoCount: 1,
        });
      } else {
        const album = albumMap.get(albumSlug);
        album.visiblePhotoCount++;
        // Track minimum distance (closest photo to center)
        album.minDistance = Math.min(album.minDistance, distance);
      }
    });

    // Convert to array and sort by proximity (closest first)
    const sortedAlbums = Array.from(albumMap.values())
      .sort((a, b) => a.minDistance - b.minDistance);

    console.log(`📊 ${sortedAlbums.length} album(s) with visible photos`, sortedAlbums);
    
    setAlbumsByProximity(sortedAlbums);
  }, [mapCenter, mapBounds, photos]);

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

    if (!photos.length) {
      // Default view (continental US-ish) if nothing to show
      map.setView([37.5, -96], 4);
      return;
    }

    // Create custom icon from SVG
    const customIcon = L.icon({
      iconUrl: `${import.meta.env.BASE_URL}icons/marker.svg`,
      iconSize: [32, 40],        // Size of the icon [width, height]
      iconAnchor: [16, 40],      // Point of the icon which corresponds to marker's location
      popupAnchor: [0, -40],     // Point from which the popup should open relative to iconAnchor
      shadowUrl: null,            // Disable default shadow
    });

    photos.forEach((photo) => {
      if (typeof photo.lat !== 'number' || typeof photo.lng !== 'number') return;

      const marker = L.marker([photo.lat, photo.lng], { icon: customIcon }).addTo(map);
      const thumbUrl = `${import.meta.env.BASE_URL}${photo.path}`;
      const albumUrl = `/album/${photo.albumSlug}`;

      const popupHtml = `
        <div class="map-popup">
          <div class="map-popup-thumb-wrap">
            <img src="${thumbUrl}" alt="${photo.filename}" class="map-popup-thumb" />
          </div>
          <div class="map-popup-meta">
            <div class="map-popup-album">${photo.albumTitle}</div>
            ${photo.dateTaken ? `<div class="map-popup-date">${String(photo.dateTaken).slice(0, 10)}</div>` : ''}
            <a href="${albumUrl}" class="map-popup-link">view album &rsaquo;</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
    });

    // Set initial view to show entire continental US
    map.setView([39.8, -98.5], 4);

    // Set initial center and bounds
    const center = map.getCenter();
    setMapCenter({ lat: center.lat, lng: center.lng });
    setMapBounds(map.getBounds());

    // Track map movement for album proximity updates
    // Using 'moveend' to avoid excessive updates during pan/zoom
    const handleMoveEnd = () => {
      const newCenter = map.getCenter();
      const newBounds = map.getBounds();
      
      setMapCenter({ lat: newCenter.lat, lng: newCenter.lng });
      setMapBounds(newBounds);
      
      console.log('🗺️  Map moved - new center:', newCenter.lat.toFixed(3), newCenter.lng.toFixed(3));
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [photos, loading, error]);

  const statusText = error
    ? 'ERROR LOADING MAP DATA'
    : loading
    ? 'SCANNING ROLLS FOR GEO TAGS...'
    : photos.length === 0
    ? 'NO GEOTAGGED FRAMES FOUND'
    : `${photos.length} GEOTAGGED FRAME${photos.length === 1 ? '' : 'S'} LOADED`;

  return (
    <main className="page-shell map-page-shell">
      <section className="page-block">
        <p className="page-label">map</p>
        <h1 className="page-title">Geo index</h1>
        <p className="page-body">
          Live index of frames with GPS coordinates. As you add geotagged photos and rescan, markers
          will appear here on the map.
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
                  <li key={album.albumSlug} className="proximity-album-item">
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
                          {album.visiblePhotoCount} photo{album.visiblePhotoCount !== 1 ? 's' : ''} visible
                        </span>
                        <span className="proximity-album-slug">/{album.albumSlug}</span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mapCenter && albumsByProximity.length === 0 && !loading && photos.length > 0 && (
            <div className="albums-panel">
              <p className="page-label">nearby albums</p>
              <h2 className="page-title">No albums in view</h2>
              <p className="page-body">
                Pan or zoom the map to show photo markers, and nearby albums will appear here.
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
