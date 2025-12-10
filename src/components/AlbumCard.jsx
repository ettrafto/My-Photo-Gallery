import { Link } from 'react-router-dom';
import './AlbumCard.css';

/**
 * AlbumCard component - displays album preview with hover collage
 * @param {Object} props
 * @param {Object} props.album - Album object
 */
export default function AlbumCard({ album }) {
  const coverUrl = `${import.meta.env.BASE_URL}${album.cover}`;
  
  // Get first 3 photos for collage (or first 3 available)
  const collagePhotos = album.photos?.slice(0, 3) || [];
  
  // Format date for display (start date only)
  const getDateDisplay = () => {
    const dateStr = album.startDate || album.date;
    if (dateStr) {
      return new Date(dateStr).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });
    }
    return null;
  };

  const dateDisplay = getDateDisplay();
  
  // Filter out camera tags (Canon, Nikon, Sony, etc.)
  const displayTags = album.tags?.filter(tag => 
    !['Canon', 'Nikon', 'Sony', 'Fujifilm', 'Olympus', 'Panasonic', 'Leica'].includes(tag)
  ) || [];

  return (
    <Link 
      to={`/album/${album.slug}`}
      className="album-card"
    >
      <div 
        className="album-cover"
        style={{ aspectRatio: album.coverAspectRatio || 1.5 }}
      >
        <img 
          src={coverUrl}
          alt={album.title}
          loading="lazy"
        />
        
        {/* Hover collage overlay */}
        {collagePhotos.length >= 3 && (
          <div className="hover-collage">
            {collagePhotos.map((photo, idx) => (
              <div key={idx} className="collage-image">
                <img 
                  src={`${import.meta.env.BASE_URL}${photo.path}`}
                  alt=""
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}
        
        {/* Favorites indicator */}
        {album.isFavorite && (
          <span className="favorite-indicator">⭐</span>
        )}
      </div>
      
      <div className="album-info">
        <h2>{album.title}</h2>
        <div className="album-meta">
          <span>{album.count} photo{album.count !== 1 ? 's' : ''}</span>
          {dateDisplay && <span>{dateDisplay}</span>}
        </div>
        {album.description && (
          <p className="album-description">{album.description}</p>
        )}
        {displayTags.length > 0 && (
          <div className="album-tags">
            {displayTags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

