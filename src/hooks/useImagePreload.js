import { useEffect } from 'react';

/**
 * useImagePreload - Hook to preload adjacent images in a lightbox/carousel
 * 
 * Preloads the next and previous images to improve navigation experience.
 * Only preloads when the current image changes to avoid unnecessary requests.
 * 
 * @param {Array} photos - Array of photo objects
 * @param {number} currentIndex - Current photo index
 * @param {string} baseUrl - Base URL for images (e.g., import.meta.env.BASE_URL)
 * @param {number} preloadCount - Number of images to preload in each direction (default: 1)
 * 
 * @example
 * useImagePreload(photos, currentIndex, import.meta.env.BASE_URL);
 * // Preloads next and previous images when currentIndex changes
 * 
 * @example
 * // Preload 2 images in each direction
 * useImagePreload(photos, currentIndex, import.meta.env.BASE_URL, 2);
 */
export function useImagePreload(photos, currentIndex, baseUrl = '', preloadCount = 1) {
  useEffect(() => {
    if (!photos || photos.length === 0) return;

    // Preload images around current index
    const indicesToPreload = [];
    
    // Preload next images
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = (currentIndex + i) % photos.length;
      indicesToPreload.push(nextIndex);
    }
    
    // Preload previous images
    for (let i = 1; i <= preloadCount; i++) {
      const prevIndex = (currentIndex - i + photos.length) % photos.length;
      indicesToPreload.push(prevIndex);
    }

    // Preload each image
    indicesToPreload.forEach(index => {
      const photo = photos[index];
      if (photo && photo.path) {
        const img = new Image();
        img.src = `${baseUrl}${photo.path}`;
        // No need to do anything with the image, browser will cache it
      }
    });
  }, [photos, currentIndex, baseUrl, preloadCount]);
}

/**
 * useImagePreloadOnMount - Preload specific images on component mount
 * 
 * Useful for preloading critical images that should load ASAP.
 * 
 * @param {Array<string>} imageUrls - Array of image URLs to preload
 * 
 * @example
 * useImagePreloadOnMount([
 *   '/images/hero1.jpg',
 *   '/images/hero2.jpg',
 *   '/images/hero3.jpg'
 * ]);
 */
export function useImagePreloadOnMount(imageUrls) {
  useEffect(() => {
    if (!imageUrls || imageUrls.length === 0) return;

    imageUrls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, []); // Empty deps - only run on mount
}

export default useImagePreload;



