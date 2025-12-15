import { useState, useEffect, useRef } from 'react';

/**
 * Hook to track which album section is currently active based on scroll position
 * Uses IntersectionObserver to determine which section is closest to viewport center
 * 
 * @param {Object} albumSectionRefs - Object mapping albumSlug to ref
 * @param {Function} onActiveChange - Callback when active album changes (albumSlug | null)
 * @returns {string | null} - Currently active album slug
 */
export function useScrollActiveAlbum(albumSectionRefs, onActiveChange) {
  const [activeAlbumSlug, setActiveAlbumSlug] = useState(null);
  const observerRef = useRef(null);
  const intersectionMapRef = useRef(new Map());

  useEffect(() => {
    if (!albumSectionRefs || Object.keys(albumSectionRefs).length === 0) {
      return;
    }

    // Create IntersectionObserver
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const albumSlug = entry.target.getAttribute('data-album-slug');
          if (albumSlug) {
            intersectionMapRef.current.set(albumSlug, {
              isIntersecting: entry.isIntersecting,
              intersectionRatio: entry.intersectionRatio,
              boundingClientRect: entry.boundingClientRect
            });
          }
        });

        // Determine active album: section closest to viewport center
        let activeSlug = null;
        let minDistance = Infinity;
        const viewportCenter = window.innerHeight / 2;

        intersectionMapRef.current.forEach((data, slug) => {
          if (data.isIntersecting && data.boundingClientRect) {
            // Calculate distance from section center to viewport center
            const sectionCenter = data.boundingClientRect.top + (data.boundingClientRect.height / 2);
            const distance = Math.abs(sectionCenter - viewportCenter);
            
            // Prefer sections with higher intersection ratio
            const adjustedDistance = distance / (1 + data.intersectionRatio);
            
            if (adjustedDistance < minDistance) {
              minDistance = adjustedDistance;
              activeSlug = slug;
            }
          }
        });

        // Update active album if it changed
        setActiveAlbumSlug(prevActive => {
          if (activeSlug !== prevActive) {
            if (onActiveChange) {
              onActiveChange(activeSlug);
            }
            return activeSlug;
          }
          return prevActive;
        });
      },
      {
        root: null, // viewport
        rootMargin: '-20% 0px -20% 0px', // Only consider sections in middle 60% of viewport
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
      }
    );

    // Observe all album sections
    Object.entries(albumSectionRefs).forEach(([slug, ref]) => {
      const element = ref?.current || ref;
      if (element) {
        observerRef.current.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      intersectionMapRef.current.clear();
    };
  }, [albumSectionRefs, onActiveChange]);

  return activeAlbumSlug;
}

