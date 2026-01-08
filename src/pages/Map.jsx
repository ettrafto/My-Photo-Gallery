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
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Map viewport state for proximity calculations
  const [mapCenter, setMapCenter] = useState(null); // { lat, lng }
  const [mapBounds, setMapBounds] = useState(null); // L.LatLngBounds
  const [albumsByProximity, setAlbumsByProximity] = useState([]);

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
        console.log(`📍 Loaded ${albumsWithGeo.length} album(s) with geo data`);
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

    console.log('🗺️  Computing album proximity for center:', mapCenter);

    // Filter albums within current map bounds
    const visibleAlbums = albums.filter(album => {
      const { lat, lng } = album.primaryLocation;
      return mapBounds.contains([lat, lng]);
    });

    console.log(`📍 ${visibleAlbums.length} of ${albums.length} albums visible in bounds`);

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

    console.log(`📊 ${sortedAlbums.length} album(s) in view`, sortedAlbums);
    
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

    // Create custom icon from SVG
    const customIcon = L.icon({
      iconUrl: `${import.meta.env.BASE_URL}icons/marker.svg`,
      iconSize: [32, 40],        // Size of the icon [width, height]
      iconAnchor: [16, 40],      // Point of the icon which corresponds to marker's location
      popupAnchor: [0, -40],     // Point from which the popup should open relative to iconAnchor
      shadowUrl: null,            // Disable default shadow
    });

    // Add markers for each album
    albums.forEach((album) => {
      const { lat, lng } = album.primaryLocation;
      
      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
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
    });

    // Fit map to show all album markers, or default to continental US
    if (albums.length > 0) {
      const bounds = L.latLngBounds(
        albums.map(album => [album.primaryLocation.lat, album.primaryLocation.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    } else {
      map.setView([39.8, -98.5], 4);
    }

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
