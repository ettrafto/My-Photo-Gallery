import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadSiteConfig } from '../lib/siteConfig';
import LazyImage from './LazyImage';
import { buildPhotoProps } from '../utils/imageUtils';
import './FavoriteAlbum.css';

/**
 * FavoriteAlbum component - displays favorite album highlight
 * Loads album data from site.json favorites.album.slug
 */
export default function FavoriteAlbum() {
  const navigate = useNavigate();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function loadFavoriteAlbum() {
      try {
        const siteConfig = await loadSiteConfig();
        const favoriteConfig = siteConfig?.favorites?.album;

        if (!favoriteConfig || !favoriteConfig.enabled || !favoriteConfig.slug) {
          setEnabled(false);
          setLoading(false);
          return;
        }

        setEnabled(true);

        // Load album data
        const albumResponse = await fetch(
          `${import.meta.env.BASE_URL}content/albums/${favoriteConfig.slug}.json`
        );

        if (!albumResponse.ok) {
          throw new Error(`Failed to load album: ${albumResponse.status}`);
        }

        const albumData = await albumResponse.json();
        setAlbum(albumData);
      } catch (err) {
        console.error('Failed to load favorite album:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFavoriteAlbum();
  }, []);

  // Don't render if not enabled
  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="favorite-album">
        <div className="favorite-album-skeleton">
          <div className="favorite-album-skeleton-image" />
          <div className="favorite-album-skeleton-content">
            <div className="favorite-album-skeleton-title" />
            <div className="favorite-album-skeleton-text" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="favorite-album">
        <div className="favorite-album-content">
          <p className="favorite-album-error">
            {error || 'Album not found'}
          </p>
        </div>
      </div>
    );
  }

  const coverPhoto = album.photos?.[0] || null;
  const coverProps = coverPhoto
    ? buildPhotoProps(coverPhoto, {
        baseUrl: import.meta.env.BASE_URL,
        sizes: "(max-width: 768px) 100vw, 50vw",
        className: "favorite-album-cover-image",
      })
    : {
        src: `${import.meta.env.BASE_URL}${album.cover}`,
        alt: album.title,
        aspectRatio: album.coverAspectRatio || 1.5,
        sizes: "(max-width: 768px) 100vw, 50vw",
      };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const dateDisplay = formatDate(album.startDate || album.date);

  return (
    <Link to={`/album/${album.slug}`} className="favorite-album">
      <div className="favorite-album-cover">
        <LazyImage
          {...coverProps}
          aspectRatio={album.coverAspectRatio || 1.5}
          threshold={0.01}
          rootMargin="50px"
        />
      </div>
      <div className="favorite-album-content">
        <div className="favorite-album-label">Featured Album</div>
        <h2 className="favorite-album-title">{album.title}</h2>
        {album.description && (
          <p className="favorite-album-description">{album.description}</p>
        )}
        <div className="favorite-album-meta">
          {dateDisplay && (
            <span className="favorite-album-date">{dateDisplay}</span>
          )}
          {album.count && (
            <span className="favorite-album-count">
              {album.count} photo{album.count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <button
          className="favorite-album-button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            navigate('/albums');
          }}
        >
          EXPLORE ALL ALBUMS
        </button>
      </div>
    </Link>
  );
}
