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
            <img src={`${baseUrl}${item.src}`} alt={item.caption || 'Route map'} />
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
              <img src={`${baseUrl}${item.src}`} alt={item.caption || 'Artifact'} />
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
            <img src={`${baseUrl}${item.src}`} alt={item.caption || 'Photo collage'} />
            {item.caption && <p className="trip-media-caption">{item.caption}</p>}
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

