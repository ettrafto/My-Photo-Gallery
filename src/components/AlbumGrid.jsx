import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './AlbumGrid.css';

export default function AlbumGrid() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/albums.json`)
      .then(res => res.json())
      .then(data => {
        setAlbums(data.albums || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load albums:', err);
        setLoading(false);
      });
  }, []);

  // Get all unique tags
  const allTags = [...new Set(albums.flatMap(album => album.tags || []))].sort();

  // Filter albums by selected tag
  const filteredAlbums = selectedTag
    ? albums.filter(album => album.tags?.includes(selectedTag))
    : albums;

  if (loading) {
    return <div className="loading">Loading albums...</div>;
  }

  if (albums.length === 0) {
    return (
      <div className="empty-state">
        <h2>No albums yet</h2>
        <p>Add images to <code>/public/images/</code> and run <code>npm run scan</code></p>
      </div>
    );
  }

  return (
    <div className="album-grid-container">
      <header className="gallery-header">
        <h1>Photo Gallery</h1>
        <p className="subtitle">{albums.length} album{albums.length !== 1 ? 's' : ''}</p>
      </header>

      {allTags.length > 0 && (
        <div className="tag-filter">
          <button 
            className={selectedTag === null ? 'active' : ''}
            onClick={() => setSelectedTag(null)}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={selectedTag === tag ? 'active' : ''}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="album-grid">
        {filteredAlbums.map(album => {
          // Build cover image URL relative to Vite base
          const coverUrl = `${import.meta.env.BASE_URL}${album.cover}`;
          return (
          <Link 
            key={album.slug} 
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
            </div>
            <div className="album-info">
              <h2>{album.title}</h2>
              <div className="album-meta">
                <span>{album.count} photo{album.count !== 1 ? 's' : ''}</span>
                {album.date && <span>{album.date}</span>}
              </div>
              {album.description && (
                <p className="album-description">{album.description}</p>
              )}
              {album.tags && album.tags.length > 0 && (
                <div className="album-tags">
                  {album.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}


