import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './NoDownloadImageWrapper.css';

/**
 * NoDownloadImageWrapper - Deterrent wrapper for gallery images
 * 
 * Features:
 * - Prevents right-click context menu on images
 * - Disables drag-to-desktop
 * - Adds transparent overlay to block "Save image as..."
 * - Maintains click interactions (for lightbox)
 * - Preserves accessibility (alt text on img)
 * 
 * NOTE: This is a deterrent only, not real security.
 * Determined users can still access images via browser dev tools.
 * 
 * @example
 * <NoDownloadImageWrapper onClick={handleClick}>
 *   <LazyImage src="..." alt="..." />
 * </NoDownloadImageWrapper>
 */
export default function NoDownloadImageWrapper({ 
  children, 
  onClick,
  className = '',
  ...rest 
}) {
  const wrapperRef = useRef(null);

  // Prevent context menu on the wrapper and its children
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleContextMenu = (e) => {
      // Only prevent if clicking on an image or within the wrapper
      const target = e.target;
      if (target.tagName === 'IMG' || wrapper.contains(target)) {
        e.preventDefault();
        return false;
      }
    };

    wrapper.addEventListener('contextmenu', handleContextMenu);
    return () => {
      wrapper.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Disable drag on all img elements inside the wrapper
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const images = wrapper.querySelectorAll('img');
    
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    images.forEach(img => {
      img.setAttribute('draggable', 'false');
      img.addEventListener('dragstart', handleDragStart);
    });

    return () => {
      images.forEach(img => {
        img.removeEventListener('dragstart', handleDragStart);
      });
    };
  }, [children]); // Re-run when children change (for lazy-loaded images)

  return (
    <div
      ref={wrapperRef}
      className={`no-download-wrapper ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
      {/* Transparent overlay to block "Save image as..." via right-click */}
      {/* Left-clicks bubble up to parent (photo-item) for lightbox */}
      <div 
        className="no-download-overlay"
        aria-hidden="true"
        onContextMenu={(e) => e.preventDefault()}
        onClick={(e) => {
          // Allow clicks to bubble to parent (photo-item div) for lightbox
          // Don't stop propagation - let it bubble naturally
        }}
      />
    </div>
  );
}

NoDownloadImageWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

