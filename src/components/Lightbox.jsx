import { useState, useEffect, useCallback } from 'react';
import { useImagePreload } from '../hooks/useImagePreload';
import NoDownloadImageWrapper from './NoDownloadImageWrapper';
import './Lightbox.css';

export default function Lightbox({ photos, initialIndex, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentPhoto = photos[currentIndex];
  
  // Preload adjacent images for smooth navigation
  useImagePreload(photos, currentIndex, import.meta.env.BASE_URL, 1);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToPrevious, goToNext]);

  // Format EXIF data for display (similar to ExifOverlay)
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const exif = currentPhoto.exif || {};
  
  // Build camera info line (camera + lens)
  const cameraLine = [exif.camera, exif.lens].filter(Boolean).join('  •  ');
  
  // Build settings line (focal length, aperture, shutter, ISO)
  const settingsLine = [
    exif.focalLength,
    exif.aperture,
    exif.shutterSpeed,
    exif.iso ? `ISO ${exif.iso}` : null
  ].filter(Boolean).join('  •  ');

  const formattedDate = formatDate(exif.dateTaken);

  const hasExifData = formattedDate || cameraLine || settingsLine;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close"></button>
        
        <button className="lightbox-nav lightbox-prev" onClick={goToPrevious} aria-label="Previous"></button>
        <button className="lightbox-nav lightbox-next" onClick={goToNext} aria-label="Next"></button>

        <div className="lightbox-image-container">
          <NoDownloadImageWrapper className="lightbox-image-wrapper">
            <img
              src={`${import.meta.env.BASE_URL}${currentPhoto.path}`}
              alt={currentPhoto.exif?.description || currentPhoto.filename}
              className="lightbox-image"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </NoDownloadImageWrapper>
        </div>

        {hasExifData && (
          <div className="lightbox-exif-info">
            <div className="lightbox-exif-header">
              <span className="lightbox-exif-filename">{currentPhoto.filename}</span>
              <span className="lightbox-exif-position">{currentIndex + 1} / {photos.length}</span>
            </div>
            <div className="lightbox-exif-details">
              {formattedDate && (
                <div className="lightbox-exif-line lightbox-exif-date">{formattedDate}</div>
              )}
              {cameraLine && (
                <div className="lightbox-exif-line lightbox-exif-camera">{cameraLine}</div>
              )}
              {settingsLine && (
                <div className="lightbox-exif-line lightbox-exif-settings">{settingsLine}</div>
              )}
            </div>
          </div>
        )}

        <div className="lightbox-help">
          ← → Navigate | ESC Close
        </div>
      </div>
    </div>
  );
}


