import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Refs for bounds checking
  const imageContainerRef = useRef(null);
  const imageElementRef = useRef(null);
  const contentRef = useRef(null);
  const prevButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const exifInfoRef = useRef(null);

  // Helper function to check if a point is inside a rectangle
  const isPointInRect = useCallback((x, y, rect) => {
    return x >= rect.left && x <= rect.right && 
           y >= rect.top && y <= rect.bottom;
  }, []);

  // Handle click - close unless clicking on protected areas
  const handleClick = useCallback((e) => {
    const target = e.target;
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Get all bounds
    const imageContainerRect = imageContainerRef.current?.getBoundingClientRect();
    const imageElementRect = imageElementRef.current?.getBoundingClientRect();
    const prevButtonRect = prevButtonRef.current?.getBoundingClientRect();
    const nextButtonRect = nextButtonRef.current?.getBoundingClientRect();
    const exifRect = exifInfoRef.current?.getBoundingClientRect();
    
    // Check if click is in empty space (content div itself)
    const isContentDiv = target === contentRef.current || target.classList.contains('lightbox-content');
    
    // ========== EARLY RETURNS FOR PROTECTED ELEMENTS ==========
    
    // Check if clicking on navigation buttons (prev/next)
    const isNavButton = target.closest('.lightbox-nav');
    if (isNavButton) {
      return;
    }
    
    // Check if clicking on EXIF info
    const isExifInfo = target.closest('.lightbox-exif-info');
    if (isExifInfo) {
      return;
    }
    
    // Check if clicking on close button (let it handle its own close)
    if (target.closest('.lightbox-close')) {
      onClose();
      return;
    }
    
    // ========== BOUNDS-BASED DETECTION (PRIMARY METHOD) ==========
    
    // Always use image element bounds if available (more accurate than container)
    const imageRect = imageElementRect || imageContainerRect;
    
    if (imageRect) {
      // Check if click is inside any protected area using bounds
      const isInImage = isPointInRect(clickX, clickY, imageRect);
      const isInPrevButton = prevButtonRect && isPointInRect(clickX, clickY, prevButtonRect);
      const isInNextButton = nextButtonRect && isPointInRect(clickX, clickY, nextButtonRect);
      const isInExif = exifRect && isPointInRect(clickX, clickY, exifRect);
      
      const isInProtectedArea = isInImage || isInPrevButton || isInNextButton || isInExif;
      
      if (isInProtectedArea) {
        return;
      } else {
        onClose();
        return;
      }
    }
    
    // ========== FALLBACK: DOM-BASED DETECTION ==========
    const isImageArea = target.closest('.lightbox-image-container') || 
                        target.closest('.lightbox-image-wrapper') ||
                        target.closest('.lightbox-image');
    
    if (isImageArea) {
      return;
    }
    
    // If clicking directly on content div (empty space), definitely close
    if (isContentDiv) {
      onClose();
      return;
    }
    
    onClose();
  }, [onClose, isPointInRect]);

  return (
    <div className="lightbox-overlay" onClick={handleClick}>
      <div className="lightbox-content" ref={contentRef} onClick={handleClick}>
        <button className="lightbox-close" onClick={onClose} aria-label="Close"></button>
        
        <button 
          ref={prevButtonRef}
          className="lightbox-nav lightbox-prev" 
          onClick={goToPrevious} 
          aria-label="Previous"
        ></button>
        <button 
          ref={nextButtonRef}
          className="lightbox-nav lightbox-next" 
          onClick={goToNext} 
          aria-label="Next"
        ></button>

        <div 
          className="lightbox-image-container" 
          ref={imageContainerRef} 
          onClick={(e) => {
            // Check if click is on the container itself (empty space) vs the image
            const target = e.target;
            const clickX = e.clientX;
            const clickY = e.clientY;
            
            // Get image element bounds
            const imageRect = imageElementRef.current?.getBoundingClientRect();
            
            if (imageRect) {
              const isInImage = isPointInRect(clickX, clickY, imageRect);
              
              // If click is NOT on the actual image element AND outside image bounds, close
              const isActualImage = target.tagName === 'IMG' || target.classList.contains('lightbox-image');
              
              if (!isActualImage && !isInImage) {
                e.stopPropagation();
                onClose();
                return;
              }
              
              // If clicking on the actual image, stop propagation
              if (isActualImage) {
                e.stopPropagation();
                return;
              }
            }
            
            // Default: stop propagation for container clicks
            e.stopPropagation();
          }}
        >
          <NoDownloadImageWrapper className="lightbox-image-wrapper">
            <img
              ref={imageElementRef}
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
          <div 
            ref={exifInfoRef}
            className="lightbox-exif-info" 
            onClick={(e) => e.stopPropagation()}
          >
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


