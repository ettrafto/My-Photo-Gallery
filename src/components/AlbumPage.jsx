import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';
import Lightbox from './Lightbox';
import LayoutControls from './LayoutControls';
import ExifOverlay from './ExifOverlay';
import LazyImage from './LazyImage';
import NoDownloadImageWrapper from './NoDownloadImageWrapper';
import CopyrightNotice from './CopyrightNotice';
import SkeletonImageGrid from './skeleton/SkeletonImageGrid';
import SkeletonBlock from './skeleton/SkeletonBlock';
import SkeletonText from './skeleton/SkeletonText';
import { getAlbumGridSizes, buildPhotoProps } from '../utils/imageUtils';
import './AlbumPage.css';

export default function AlbumPage() {
  const { slug } = useParams();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(null);
  const [imagesAcross, setImagesAcross] = useState(3);
  const [layoutMode, setLayoutMode] = useState('masonry');

  // SEO with dynamic album data
  useSEO({ 
    pageTitle: album?.title || "Album",
    description: album?.description || (album ? `View ${album.count || 0} photos from ${album.title}.` : undefined),
    ogImage: album?.cover ? album.cover : undefined
  });

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.BASE_URL}content/albums/${slug}.json`)
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
    return (
      <div className="album-page">
        <div className="album-header">
          <SkeletonBlock width="140px" height="1rem" variant="light" />
          <SkeletonBlock width="320px" height="2.4rem" variant="light" />
          <SkeletonText lines={2} />
          <div className="album-meta">
            <SkeletonBlock width="80px" height="0.9rem" />
            <SkeletonBlock width="60px" height="0.9rem" />
          </div>
          <div className="album-tags">
            <SkeletonBlock width="70px" height="1.6rem" rounded={999} />
            <SkeletonBlock width="90px" height="1.6rem" rounded={999} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <SkeletonBlock width="200px" height="1.8rem" />
        </div>

        <SkeletonImageGrid count={12} layoutMode={layoutMode} imagesAcross={imagesAcross} />
      </div>
    );
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

      <LayoutControls
        imagesAcross={imagesAcross}
        layoutMode={layoutMode}
        onImagesAcrossChange={setImagesAcross}
        onLayoutModeChange={setLayoutMode}
      />

      <div 
        className={`photo-grid ${layoutMode === 'masonry' ? 'masonry-layout' : ''}`}
        style={{
          gridTemplateColumns: layoutMode === 'grid' 
            ? `repeat(${imagesAcross}, 1fr)` 
            : undefined,
          columnCount: layoutMode === 'masonry' ? imagesAcross : undefined
        }}
      >
        {album.photos.map((photo, index) => {
          // Build photo URL relative to Vite base
          const photoUrl = `${import.meta.env.BASE_URL}${photo.path}`;
          
          // Generate responsive sizes attribute based on grid columns
          const sizes = getAlbumGridSizes(imagesAcross);
          
          // Build photo props for optimized loading
          const basePhotoProps = buildPhotoProps(photo, {
            baseUrl: import.meta.env.BASE_URL,
            sizes,
            className: 'photo-item-image',
          });
          
          // In masonry mode, don't pass aspectRatio to allow natural image dimensions
          const photoProps = layoutMode === 'masonry' 
            ? (() => {
                const { aspectRatio, ...rest } = basePhotoProps;
                return rest;
              })()
            : basePhotoProps;
          
          return (
          <div
            key={photo.filename}
            className="photo-item"
            style={{ 
              // In grid mode: use aspect ratio to create uniform cells
              // In masonry mode: no aspect ratio - let image determine height naturally
              aspectRatio: layoutMode === 'grid' ? (photo.aspectRatio || 1.5) : undefined 
            }}
            onClick={() => setSelectedPhotoIndex(index)}
          >
            <NoDownloadImageWrapper>
              <LazyImage
                {...photoProps}
                // Performance: Load first 6 images eagerly (likely above fold)
                threshold={index < 6 ? 0 : 0.01}
                rootMargin={index < 6 ? '0px' : '100px'}
              />
            </NoDownloadImageWrapper>
            {/* Retro EXIF overlay - appears on hover */}
            <ExifOverlay 
              photo={photo}
              currentIndex={index + 1}
              totalImages={album.photos.length}
            />
          </div>
          );
        })}
      </div>

      <CopyrightNotice />

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


