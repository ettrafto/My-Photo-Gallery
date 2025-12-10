import { useState } from 'react';
import Lightbox from './Lightbox';
import './TripGallery.css';

/**
 * TripGallery - displays trip photos grouped by album
 * Each album gets its own section with header and photo grid
 * @param {Object} props
 * @param {import('../types/trips.jsdoc').Photo[]} props.tripPhotos - All photos for the trip
 * @param {string[]} props.albumSlugs - Ordered list of album slugs from trip
 */
export default function TripGallery({ tripPhotos, albumSlugs }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxPhotos, setLightboxPhotos] = useState([]);

  if (!tripPhotos || tripPhotos.length === 0 || !albumSlugs || albumSlugs.length === 0) {
    return null;
  }

  // Group photos by album, maintaining trip.albumSlugs order
  const photosByAlbum = albumSlugs.map(albumSlug => {
    const albumPhotos = tripPhotos.filter(photo => photo.albumSlug === albumSlug);
    
    if (albumPhotos.length === 0) return null;

    // Sort album photos by date taken
    const sortedAlbumPhotos = albumPhotos.sort((a, b) => {
      const dateA = a.dateTaken ? new Date(a.dateTaken) : new Date(0);
      const dateB = b.dateTaken ? new Date(b.dateTaken) : new Date(0);
      return dateA - dateB;
    });

    // Get album title from first photo
    const albumTitle = albumPhotos[0]?.albumTitle || albumSlug;

    return {
      slug: albumSlug,
      title: albumTitle,
      photos: sortedAlbumPhotos
    };
  }).filter(Boolean); // Remove null entries (albums with no photos)

  const handlePhotoClick = (albumPhotos, index) => {
    setLightboxPhotos(albumPhotos);
    setLightboxIndex(index);
    setLightboxOpen(true);
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
      <div className="trip-gallery-container">
        {/* Top-level heading */}
        <div className="trip-gallery-main-header">
          <h3 className="trip-gallery-main-title">Photos by Album</h3>
          <div className="trip-gallery-main-count">
            {photosByAlbum.length} album{photosByAlbum.length !== 1 ? 's' : ''} · {tripPhotos.length} photo{tripPhotos.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* One section per album */}
        {photosByAlbum.map((album) => (
          <div key={album.slug} className="trip-gallery-album-section">
            {/* Album header - reusing "All Photos" header style */}
            <div className="trip-gallery-header">
              <h3 className="trip-gallery-title">All photos from {album.title}</h3>
              <div className="trip-gallery-count">
                {album.photos.length} photo{album.photos.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Album photo grid */}
            <div className="trip-gallery-grid">
              {album.photos.map((photo, index) => {
                const photoUrl = `${import.meta.env.BASE_URL}${photo.path}`;
                const dateStr = formatDate(photo.dateTaken);

                return (
                  <div
                    key={photo.filename}
                    className="trip-gallery-item"
                    onClick={() => handlePhotoClick(album.photos, index)}
                  >
                    <img
                      src={photoUrl}
                      alt={photo.filename}
                      className="trip-gallery-image"
                      loading="lazy"
                    />
                    <div className="trip-gallery-overlay">
                      <div className="trip-gallery-info">
                        {dateStr && <span className="trip-gallery-date">{dateStr}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

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

