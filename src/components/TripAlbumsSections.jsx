import { useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import TripAlbumSection from './TripAlbumSection';
import { useScrollActiveAlbum } from '../hooks/useScrollActiveAlbum';
import './TripAlbumsSections.css';

/**
 * TripAlbumsSections - Container for all album sections with scroll tracking
 * 
 * @param {Object} props
 * @param {Array} props.albums - Array of album objects { slug, title, photos }
 * @param {string} props.activeAlbumSlug - Currently active album slug (from parent state)
 * @param {Function} props.onAlbumActivate - Callback when album becomes active via scroll
 * @param {Function} props.onPhotoClick - Callback for photo click (photo, indexInAlbum, indexInTrip)
 * @param {number} props.totalTripPhotos - Total number of photos in the trip
 */
const TripAlbumsSections = forwardRef(function TripAlbumsSections({ albums, activeAlbumSlug, onAlbumActivate, onPhotoClick, totalTripPhotos }, ref) {
  // Create refs for each album section - use object that persists across renders
  const albumSectionRefsRef = useRef({});
  
  // Initialize refs for all albums
  albums.forEach(album => {
    if (!albumSectionRefsRef.current[album.slug]) {
      albumSectionRefsRef.current[album.slug] = { current: null };
    }
  });

  // Track active album via scroll
  const scrollActiveAlbum = useScrollActiveAlbum(albumSectionRefsRef.current, onAlbumActivate);

  // Use scroll-tracked active album if no explicit activeAlbumSlug is set
  const effectiveActiveSlug = activeAlbumSlug || scrollActiveAlbum;

  // Expose refs to parent if needed
  useImperativeHandle(ref, () => albumSectionRefsRef.current, []);

  if (!albums || albums.length === 0) {
    return null;
  }

  // Calculate starting index for each album in the full trip photos array
  let currentStartIndex = 0;
  const albumsWithIndices = albums.map(album => {
    const startIndex = currentStartIndex;
    currentStartIndex += album.photos.length;
    return { ...album, startIndex };
  });

  return (
    <div className="trip-albums-sections">
      {albumsWithIndices.map((album) => (
        <div
          key={album.slug}
          ref={el => {
            if (albumSectionRefsRef.current[album.slug]) {
              albumSectionRefsRef.current[album.slug].current = el;
            }
          }}
          data-album-slug={album.slug}
        >
          <TripAlbumSection
            album={album}
            isActive={effectiveActiveSlug === album.slug}
            onPhotoClick={onPhotoClick}
            startIndexInTrip={album.startIndex}
            totalTripPhotos={totalTripPhotos}
          />
        </div>
      ))}
    </div>
  );
});

export default TripAlbumsSections;

