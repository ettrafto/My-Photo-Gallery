import { useState, useEffect } from 'react';
import './Lightbox.css';

export default function Lightbox({ photos, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showExif, setShowExif] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'i' || e.key === 'I') setShowExif(prev => !prev);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToPrevious = () => {
    setCurrentIndex((currentIndex - 1 + photos.length) % photos.length);
  };

  const goToNext = () => {
    setCurrentIndex((currentIndex + 1) % photos.length);
  };

  const hasExifData = () => {
    const exif = currentPhoto.exif;
    return exif && (
      exif.camera || exif.lens || exif.aperture || 
      exif.shutterSpeed || exif.iso || exif.focalLength ||
      exif.dateTaken || exif.artist || exif.copyright
    );
  };

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>×</button>
        
        <button className="lightbox-nav lightbox-prev" onClick={goToPrevious}>‹</button>
        <button className="lightbox-nav lightbox-next" onClick={goToNext}>›</button>

        <div className="lightbox-image-container">
          <img
            src={currentPhoto.path}
            alt={currentPhoto.exif?.description || currentPhoto.filename}
            className="lightbox-image"
          />
        </div>

        <div className="lightbox-info">
          <div className="lightbox-header">
            <div>
              <div className="photo-filename">{currentPhoto.filename}</div>
              <div className="photo-counter">
                {currentIndex + 1} / {photos.length}
              </div>
            </div>
            {hasExifData() && (
              <button 
                className={`exif-toggle ${showExif ? 'active' : ''}`}
                onClick={() => setShowExif(!showExif)}
                title="Toggle EXIF data (press 'i')"
              >
                ℹ️ EXIF
              </button>
            )}
          </div>

          {showExif && hasExifData() && (
            <div className="exif-data">
              {currentPhoto.exif.dateTaken && (
                <div className="exif-row">
                  <span className="exif-label">Date:</span>
                  <span className="exif-value">{currentPhoto.exif.dateTaken}</span>
                </div>
              )}
              {currentPhoto.exif.camera && (
                <div className="exif-row">
                  <span className="exif-label">Camera:</span>
                  <span className="exif-value">{currentPhoto.exif.camera}</span>
                </div>
              )}
              {currentPhoto.exif.lens && (
                <div className="exif-row">
                  <span className="exif-label">Lens:</span>
                  <span className="exif-value">{currentPhoto.exif.lens}</span>
                </div>
              )}
              <div className="exif-row">
                {currentPhoto.exif.focalLength && (
                  <span className="exif-setting">{currentPhoto.exif.focalLength}</span>
                )}
                {currentPhoto.exif.aperture && (
                  <span className="exif-setting">{currentPhoto.exif.aperture}</span>
                )}
                {currentPhoto.exif.shutterSpeed && (
                  <span className="exif-setting">{currentPhoto.exif.shutterSpeed}</span>
                )}
                {currentPhoto.exif.iso && (
                  <span className="exif-setting">ISO {currentPhoto.exif.iso}</span>
                )}
              </div>
              {currentPhoto.exif.artist && (
                <div className="exif-row">
                  <span className="exif-label">Artist:</span>
                  <span className="exif-value">{currentPhoto.exif.artist}</span>
                </div>
              )}
              {currentPhoto.exif.copyright && (
                <div className="exif-row">
                  <span className="exif-label">Copyright:</span>
                  <span className="exif-value">{currentPhoto.exif.copyright}</span>
                </div>
              )}
              {currentPhoto.exif.description && (
                <div className="exif-row">
                  <span className="exif-label">Description:</span>
                  <span className="exif-value">{currentPhoto.exif.description}</span>
                </div>
              )}
              {currentPhoto.width && currentPhoto.height && (
                <div className="exif-row">
                  <span className="exif-label">Dimensions:</span>
                  <span className="exif-value">{currentPhoto.width} × {currentPhoto.height}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lightbox-help">
          ← → Navigate | ESC Close | I Toggle Info
        </div>
      </div>
    </div>
  );
}


