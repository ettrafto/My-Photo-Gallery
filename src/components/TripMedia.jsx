import Photo from './Photo';
import './TripMedia.css';

/**
 * TripMedia - renders different types of supplemental media for trips
 * @param {Object} props
 * @param {import('../types/trips.jsdoc').TripMediaItem[]} props.mediaItems - Array of media items
 */
export default function TripMedia({ mediaItems }) {
  if (!mediaItems || mediaItems.length === 0) {
    return null;
  }

  const renderMediaItem = (item, index) => {
    const baseUrl = import.meta.env.BASE_URL;

    switch (item.type) {
      case 'map-image':
        return (
          <div key={index} className="trip-media-item trip-media-map-image">
            <Photo 
              src={`${baseUrl}${item.src}`} 
              alt={item.caption || 'Route map'}
              loading="lazy"
              decoding="async"
            />
            {item.caption && <p className="trip-media-caption">{item.caption}</p>}
          </div>
        );

      case 'journal':
        return (
          <div key={index} className="trip-media-item trip-media-journal">
            <div className="trip-media-journal-icon">📖</div>
            <div className="trip-media-journal-content">
              <h4 className="trip-media-journal-title">{item.title || 'Trip Journal'}</h4>
              {item.caption && <p className="trip-media-caption">{item.caption}</p>}
              <a 
                href={`${baseUrl}${item.src}`} 
                className="trip-media-journal-link"
                target="_blank" 
                rel="noopener noreferrer"
              >
                Read journal →
              </a>
            </div>
          </div>
        );

      case 'video':
        return (
          <div key={index} className="trip-media-item trip-media-video">
            <video 
              src={`${baseUrl}${item.src}`} 
              controls 
              className="trip-media-video-player"
            >
              Your browser does not support video playback.
            </video>
            {item.caption && <p className="trip-media-caption">{item.caption}</p>}
          </div>
        );

      case 'artifact':
        return (
          <div key={index} className="trip-media-item trip-media-artifact">
            <div className="trip-media-artifact-image">
              <Photo 
                src={`${baseUrl}${item.src}`} 
                alt={item.caption || 'Artifact'}
                loading="lazy"
                decoding="async"
              />
            </div>
            {item.caption && <p className="trip-media-caption">{item.caption}</p>}
          </div>
        );

      case 'gpx':
        return (
          <div key={index} className="trip-media-item trip-media-gpx">
            <div className="trip-media-gpx-icon">🗺️</div>
            <div className="trip-media-gpx-content">
              <h4 className="trip-media-gpx-title">GPS Track</h4>
              {item.caption && <p className="trip-media-caption">{item.caption}</p>}
              <a 
                href={`${baseUrl}${item.src}`} 
                className="trip-media-gpx-link"
                download
              >
                Download GPX file →
              </a>
            </div>
          </div>
        );

      case 'collage':
        return (
          <div key={index} className="trip-media-item trip-media-collage">
            <Photo 
              src={`${baseUrl}${item.src}`} 
              alt={item.caption || 'Photo collage'}
              loading="lazy"
              decoding="async"
            />
            {item.caption && <p className="trip-media-caption">{item.caption}</p>}
          </div>
        );

      case 'playlist-link':
        return (
          <div key={index} className="trip-media-item trip-media-playlist-link">
            <a 
              href={item.href} 
              className="trip-media-playlist-link-card"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <div className="trip-media-playlist-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="trip-media-playlist-content">
                <span className="trip-media-playlist-label">{item.label || item.caption || 'YouTube Playlist'}</span>
                {item.caption && item.label && <span className="trip-media-playlist-caption">{item.caption}</span>}
                <span className="trip-media-playlist-hint">Watch on YouTube →</span>
              </div>
            </a>
          </div>
        );

      case 'external-link':
        return (
          <div key={index} className="trip-media-item trip-media-external-link">
            <a 
              href={item.href} 
              className="trip-media-external-link-card"
              target="_blank" 
              rel="noopener noreferrer"
            >
              <div className="trip-media-external-icon">🔗</div>
              <div className="trip-media-external-content">
                <span className="trip-media-external-label">{item.label || 'External Link'}</span>
                <span className="trip-media-external-hint">Opens in new tab →</span>
              </div>
            </a>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="trip-media-section">
      <h3 className="trip-media-title">More From This Trip</h3>
      <div className="trip-media-grid">
        {mediaItems.map((item, index) => renderMediaItem(item, index))}
      </div>
    </div>
  );
}

