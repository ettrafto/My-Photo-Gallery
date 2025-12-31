import { useState, useEffect } from 'react';

/**
 * useLowQualityMode - Hook to determine if low-quality images should be used
 * 
 * Returns true when the viewport is narrow (mobile) or when a user preference
 * is set to save bandwidth. This prevents loading large images unnecessarily.
 * 
 * Current implementation: Based on viewport width
 * Future: Can be extended to check user preferences, network speed, data saver mode
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.breakpoint - Viewport width threshold (default: 768px)
 * @param {boolean} options.respectUserPreference - Check for user's data saver setting (future)
 * @returns {boolean} True if low-quality mode should be used
 * 
 * @example
 * const lowQuality = useLowQualityMode();
 * const imageUrl = lowQuality ? smallImage : largeImage;
 * 
 * @example
 * // Custom breakpoint
 * const lowQuality = useLowQualityMode({ breakpoint: 1024 });
 */
export function useLowQualityMode({ breakpoint = 768 } = {}) {
  const [isLowQuality, setIsLowQuality] = useState(() => {
    // Initialize based on current viewport
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    // Update on resize
    const handleResize = () => {
      setIsLowQuality(window.innerWidth < breakpoint);
    };

    // Use ResizeObserver if available, otherwise fallback to resize event
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(document.documentElement);
      
      return () => {
        resizeObserver.disconnect();
      };
    } else {
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [breakpoint]);

  return isLowQuality;
}

/**
 * useNetworkQuality - Hook to detect network quality
 * 
 * Uses the Network Information API to determine connection quality.
 * Falls back to viewport-based detection if API is unavailable.
 * 
 * @returns {Object} Network quality information
 * 
 * @example
 * const { isSlowConnection, effectiveType } = useNetworkQuality();
 * if (isSlowConnection) {
 *   // Use smaller images
 * }
 */
export function useNetworkQuality() {
  const [networkInfo, setNetworkInfo] = useState({
    isSlowConnection: false,
    effectiveType: '4g',
    downlink: null,
    saveData: false
  });

  useEffect(() => {
    // Check if Network Information API is available
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;

    if (!connection) {
      // Fallback: assume fast connection
      return;
    }

    const updateNetworkInfo = () => {
      const effectiveType = connection.effectiveType || '4g';
      const isSlowConnection = ['slow-2g', '2g', '3g'].includes(effectiveType);
      const saveData = connection.saveData || false;

      setNetworkInfo({
        isSlowConnection,
        effectiveType,
        downlink: connection.downlink,
        saveData
      });
    };

    // Initial check
    updateNetworkInfo();

    // Listen for changes
    connection.addEventListener('change', updateNetworkInfo);

    return () => {
      connection.removeEventListener('change', updateNetworkInfo);
    };
  }, []);

  return networkInfo;
}

/**
 * useAdaptiveQuality - Hook combining viewport and network quality
 * 
 * Returns the most appropriate quality level based on viewport size,
 * network conditions, and user preferences.
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.breakpoint - Viewport width threshold
 * @param {boolean} options.respectNetwork - Consider network speed (default: true)
 * @returns {Object} Quality settings
 * 
 * @example
 * const { shouldUseLowQuality, reason } = useAdaptiveQuality();
 * 
 * if (shouldUseLowQuality) {
 *   console.log(`Using low quality: ${reason}`);
 * }
 */
export function useAdaptiveQuality({ 
  breakpoint = 768,
  respectNetwork = true 
} = {}) {
  const isNarrowViewport = useLowQualityMode({ breakpoint });
  const { isSlowConnection, saveData } = useNetworkQuality();

  let shouldUseLowQuality = false;
  let reason = 'Fast connection and wide viewport';

  if (isNarrowViewport) {
    shouldUseLowQuality = true;
    reason = 'Narrow viewport (mobile)';
  } else if (respectNetwork && saveData) {
    shouldUseLowQuality = true;
    reason = 'User has data saver enabled';
  } else if (respectNetwork && isSlowConnection) {
    shouldUseLowQuality = true;
    reason = 'Slow network connection';
  }

  return {
    shouldUseLowQuality,
    reason,
    isNarrowViewport,
    isSlowConnection,
    saveData
  };
}

export default useLowQualityMode;











