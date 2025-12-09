import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Lightbox from './Lightbox';
import './AlbumPage.css';

export default function AlbumPage() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/content/albums/${slug}.json`)
      .then(res => res.json())
      .then(data => {
        setAlbum(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load album:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading album...</div>;
  }

  if (!album) {
    return (
      <div className="empty-state">
        <h2>Album not found</h2>
        <Link to="/">← Back to albums</Link>
      </div>
    );
  }

  return (
    <div className="album-page">
      <div className="album-header">
        <Link to="/" className="back-link">← All Albums</Link>
        <h1>{album.title}</h1>
        {album.description && <p className="description">{album.description}</p>}
        <div className="album-meta">
          <span>{album.count} photo{album.count !== 1 ? 's' : ''}</span>
          {album.date && <span>{album.date}</span>}
        </div>
        {album.tags && album.tags.length > 0 && (
          <div className="album-tags">
            {album.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="photo-grid">
        {album.photos.map((photo, index) => (
          <div
            key={photo.filename}
            className="photo-item"
            style={{ aspectRatio: photo.aspectRatio || 1.5 }}
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <img
              src={photo.path}
              alt={photo.exif?.description || photo.filename}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {selectedPhotoIndex !== null && (
        <Lightbox
          photos={album.photos}
          initialIndex={selectedPhotoIndex}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}


