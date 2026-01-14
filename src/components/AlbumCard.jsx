import { Link } from 'react-router-dom';
import LazyImage from './LazyImage';
import { buildPhotoProps } from '../utils/imageUtils';
import './AlbumCard.css';

/**
 * AlbumCard component - displays album preview with hover collage
 * @param {Object} props
 * @param {Object} props.album - Album object
 */
export default function AlbumCard({ album }) {
  const coverAspectRatio = 4/3; // Fixed 4:3 aspect ratio for all album covers
  
  // Find the photo that matches album.cover, or fall back to first photo
  const coverPhoto = album.cover && album.photos
    ? album.photos.find(photo => photo.path === album.cover || photo.pathLarge === album.cover)
    : null;
  const fallbackPhoto = coverPhoto || (album.photos?.[0] || null);
  
  const coverProps = fallbackPhoto
    ? (() => {
        const props = buildPhotoProps(fallbackPhoto, {
          baseUrl: import.meta.env.BASE_URL,
          sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
          className: "album-cover-image",
        });
        // Remove width, height, and aspectRatio - let container control sizing via CSS
        const { width, height, aspectRatio, ...rest } = props;
        return rest;
      })()
    : album.cover ? {
        src: `${import.meta.env.BASE_URL}${album.cover}`,
        alt: album.title,
        sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
      } : null;
  
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
      <div className="album-cover">
        <LazyImage 
          {...coverProps}
          aspectRatio={coverAspectRatio}
          threshold={0}
          rootMargin="0px"
          style={{ position: 'absolute', inset: 0, aspectRatio: 'unset' }}
        />
        
        {/* Hover collage overlay */}
        {collagePhotos.length >= 3 && (
          <div className="hover-collage">
            {collagePhotos.map((photo, idx) => (
              <div key={idx} className="collage-image">
                <LazyImage 
                  {...buildPhotoProps(photo, {
                    baseUrl: import.meta.env.BASE_URL,
                    sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
                    className: "album-cover-image",
                  })}
                  threshold={0}
                  rootMargin="0px"
                />
              </div>
            ))}
          </div>
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

