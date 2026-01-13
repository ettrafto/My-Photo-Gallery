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

  // Log refs on mount/update for debugging
  useEffect(() => {
    console.log('🔧 Lightbox Refs Status:', {
      imageContainer: !!imageContainerRef.current,
      imageElement: !!imageElementRef.current,
      prevButton: !!prevButtonRef.current,
      nextButton: !!nextButtonRef.current,
      exifInfo: !!exifInfoRef.current,
      content: !!contentRef.current
    });
    
    if (imageElementRef.current) {
      const rect = imageElementRef.current.getBoundingClientRect();
      console.log('🖼️ Image element bounds on mount:', rect);
    }
    if (imageContainerRef.current) {
      const rect = imageContainerRef.current.getBoundingClientRect();
      console.log('📦 Image container bounds on mount:', rect);
    }
  });

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

  // Debug logging flag - ALWAYS ON for debugging
  const DEBUG_LOGGING = true;

  // Handle click - close unless clicking on protected areas
  const handleClick = useCallback((e) => {
    // ALWAYS log that handler was called
    console.log('🎯 CLICK HANDLER CALLED - Handler is firing!');
    
    const target = e.target;
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // ========== COMPREHENSIVE LOGGING ==========
    console.group('🔍 Lightbox Click Handler Debug');
    console.log('📍 Click coordinates:', { x: clickX, y: clickY });
    console.log('🎯 Target element:', target);
    console.log('🏷️ Target classes:', target.className);
    console.log('📦 Target tag:', target.tagName);
    console.log('🔗 Target ID:', target.id);
    console.log('📍 Current target:', e.currentTarget);
    console.log('📍 Current target classes:', e.currentTarget?.className);
    
    // Get all bounds
    const imageContainerRect = imageContainerRef.current?.getBoundingClientRect();
    const imageElementRect = imageElementRef.current?.getBoundingClientRect();
    const prevButtonRect = prevButtonRef.current?.getBoundingClientRect();
    const nextButtonRect = nextButtonRef.current?.getBoundingClientRect();
    const exifRect = exifInfoRef.current?.getBoundingClientRect();
    
    console.log('📐 Image container bounds:', imageContainerRect);
    console.log('🖼️ Image element bounds:', imageElementRect);
    console.log('◀️ Prev button bounds:', prevButtonRect);
    console.log('▶️ Next button bounds:', nextButtonRect);
    console.log('ℹ️ EXIF info bounds:', exifRect);
    
    // Check if click is in empty space (content div itself)
    const isContentDiv = target === contentRef.current || target.classList.contains('lightbox-content');
    console.log('📦 Is clicking directly on content div?', isContentDiv);
    
    // ========== EARLY RETURNS FOR PROTECTED ELEMENTS ==========
    
    // Check if clicking on navigation buttons (prev/next)
    const isNavButton = target.closest('.lightbox-nav');
    if (isNavButton) {
      if (DEBUG_LOGGING) {
        console.log('✅ Protected: Navigation button clicked - NOT closing');
        console.groupEnd();
      }
      return;
    }
    
    // Check if clicking on EXIF info
    const isExifInfo = target.closest('.lightbox-exif-info');
    if (isExifInfo) {
      if (DEBUG_LOGGING) {
        console.log('✅ Protected: EXIF info clicked - NOT closing');
        console.groupEnd();
      }
      return;
    }
    
    // Check if clicking on close button (let it handle its own close)
    if (target.closest('.lightbox-close')) {
      if (DEBUG_LOGGING) {
        console.log('✅ Close button clicked - closing');
        console.groupEnd();
      }
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
      
      console.log('🔍 Bounds check results:', {
        isInImage,
        isInPrevButton,
        isInNextButton,
        isInExif,
        imageRectUsed: imageElementRect ? 'element (accurate)' : 'container (fallback)',
        imageRectLeft: imageRect.left,
        imageRectRight: imageRect.right,
        imageRectTop: imageRect.top,
        imageRectBottom: imageRect.bottom,
        clickX,
        clickY,
        clickXvsLeft: clickX < imageRect.left ? 'LEFT of image' : clickX > imageRect.right ? 'RIGHT of image' : 'INSIDE image X',
        clickYvsTop: clickY < imageRect.top ? 'ABOVE image' : clickY > imageRect.bottom ? 'BELOW image' : 'INSIDE image Y'
      });
      
      const isInProtectedArea = isInImage || isInPrevButton || isInNextButton || isInExif;
      
      if (isInProtectedArea) {
        console.log('✅ Protected: Click is inside protected area bounds - NOT closing');
        console.groupEnd();
        return;
      } else {
        console.log('❌ Click is outside all protected areas - CLOSING');
        console.log('📍 Specifically:', {
          leftOfImage: clickX < imageRect.left,
          rightOfImage: clickX > imageRect.right,
          aboveImage: clickY < imageRect.top,
          belowImage: clickY > imageRect.bottom
        });
        console.groupEnd();
        onClose();
        return;
      }
    } else {
      console.warn('⚠️ No image bounds available!');
    }
    
    // ========== FALLBACK: DOM-BASED DETECTION ==========
    console.log('⚠️ Bounds checking failed or no bounds, using DOM-based fallback');
    
    const isImageArea = target.closest('.lightbox-image-container') || 
                        target.closest('.lightbox-image-wrapper') ||
                        target.closest('.lightbox-image');
    
    console.log('🔍 DOM check - isImageArea:', !!isImageArea);
    
    if (isImageArea) {
      console.log('✅ Protected: Image area detected via DOM - NOT closing');
      console.groupEnd();
      return;
    }
    
    // If clicking directly on content div (empty space), definitely close
    if (isContentDiv) {
      console.log('📦 Clicking on content div (empty space) - CLOSING');
      console.groupEnd();
      onClose();
      return;
    }
    
    console.log('❌ No protection found - CLOSING');
    console.groupEnd();
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
            
            console.log('📦 Image container area clicked!', {
              target: target.className,
              targetTag: target.tagName,
              isImage: target.classList.contains('lightbox-image') || target.tagName === 'IMG',
              isWrapper: target.classList.contains('lightbox-image-wrapper'),
              isContainer: target.classList.contains('lightbox-image-container'),
              isNoDownloadOverlay: target.classList.contains('no-download-overlay')
            });
            
            // Get image element bounds
            const imageRect = imageElementRef.current?.getBoundingClientRect();
            
            if (imageRect) {
              const isInImage = isPointInRect(clickX, clickY, imageRect);
              
              console.log('🔍 Bounds check for container click:', {
                clickX,
                clickY,
                imageLeft: imageRect.left,
                imageRight: imageRect.right,
                imageTop: imageRect.top,
                imageBottom: imageRect.bottom,
                isInImage,
                leftOfImage: clickX < imageRect.left,
                rightOfImage: clickX > imageRect.right,
                aboveImage: clickY < imageRect.top,
                belowImage: clickY > imageRect.bottom
              });
              
              // If click is NOT on the actual image element AND outside image bounds, close
              const isActualImage = target.tagName === 'IMG' || target.classList.contains('lightbox-image');
              
              if (!isActualImage && !isInImage) {
                console.log('❌ Click in container/wrapper but outside image bounds - CLOSING');
                e.stopPropagation();
                onClose();
                return;
              }
              
              // If clicking on the actual image, stop propagation
              if (isActualImage) {
                console.log('✅ Click on actual image - stopping propagation');
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


