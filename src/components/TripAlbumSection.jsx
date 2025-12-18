import { useState } from 'react';
import Lightbox from './Lightbox';
import LazyImage from './LazyImage';
import ExifOverlay from './ExifOverlay';
import NoDownloadImageWrapper from './NoDownloadImageWrapper';
import { getTripGallerySizes, buildPhotoProps } from '../utils/imageUtils';
import './TripAlbumSection.css';

/**
 * TripAlbumSection - Individual album section with header and photo grid
 * 
 * @param {Object} props
 * @param {Object} props.album - Album object with { slug, title, photos }
 * @param {boolean} props.isActive - Whether this album is currently active
 * @param {Function} props.onPhotoClick - Callback for photo click (photo, indexInAlbum, indexInTrip)
 * @param {number} props.startIndexInTrip - Starting index of this album's photos in the full trip photos array
 * @param {number} props.totalTripPhotos - Total number of photos in the trip (for EXIF overlay)
 */
export default function TripAlbumSection({ album, isActive, onPhotoClick, startIndexInTrip = 0, totalTripPhotos = 0 }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);

  if (!album || !album.photos || album.photos.length === 0) {
    return (
      <section 
        className={`trip-album-section ${isActive ? 'trip-album-section-active' : ''}`}
        data-album-slug={album?.slug}
      >
        <div className="trip-album-header">
          <h3 className="trip-album-title">{album?.title || album?.slug}</h3>
          <div className="trip-album-count">0 photos</div>
        </div>
        <div className="trip-album-empty">
          <p>No photos in this album.</p>
        </div>
      </section>
    );
  }

  // Sort photos by date taken
  const sortedPhotos = [...album.photos].sort((a, b) => {
    const dateA = a.dateTaken ? new Date(a.dateTaken) : new Date(0);
    const dateB = b.dateTaken ? new Date(b.dateTaken) : new Date(0);
    return dateA - dateB;
  });

  const handlePhotoClick = (indexInAlbum) => {
    const indexInTrip = startIndexInTrip + indexInAlbum;
    // If parent provides onPhotoClick, use it (for shared lightbox across all trip photos)
    if (onPhotoClick) {
      onPhotoClick(sortedPhotos[indexInAlbum], indexInAlbum, indexInTrip);
    } else {
      // Fallback: use local lightbox with just this album's photos
      setLightboxPhotos(sortedPhotos);
      setLightboxIndex(indexInAlbum);
      setLightboxOpen(true);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <section 
        className={`trip-album-section ${isActive ? 'trip-album-section-active' : ''}`}
        data-album-slug={album.slug}
      >
        <div className="trip-album-header">
          <h3 className="trip-album-title">{album.title}</h3>
          <div className="trip-album-count">
            {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="trip-album-grid">
          {sortedPhotos.map((photo, index) => {
            const dateStr = formatDate(photo.dateTaken);

            // Generate responsive sizes and props
            const sizes = getTripGallerySizes();
            const photoProps = buildPhotoProps(photo, {
              baseUrl: import.meta.env.BASE_URL,
              sizes,
              className: 'trip-album-image',
            });

            return (
              <div
                key={photo.filename}
                className="trip-album-item"
                onClick={() => handlePhotoClick(index)}
              >
                <NoDownloadImageWrapper>
                  <LazyImage
                    {...photoProps}
                    threshold={0.01}
                    rootMargin="100px"
                  />
                </NoDownloadImageWrapper>
                {/* EXIF overlay - appears on hover (like AlbumPage) */}
                <ExifOverlay 
                  photo={photo}
                  currentIndex={startIndexInTrip + index + 1}
                  totalImages={totalTripPhotos || sortedPhotos.length}
                />
                <div className="trip-album-overlay">
                  <div className="trip-album-info">
                    {dateStr && <span className="trip-album-date">{dateStr}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {lightboxOpen && (
        <Lightbox
          photos={lightboxPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

