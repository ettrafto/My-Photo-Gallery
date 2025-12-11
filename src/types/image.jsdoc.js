/**
 * @fileoverview Type definitions for image components and utilities
 * These types can be used for JSDoc annotations throughout the codebase
 */

/**
 * @typedef {Object} ImageSource
 * @property {string} [srcSmall] - Small image variant (~800px)
 * @property {string} [src] - Medium/default image variant (~1200px)
 * @property {string} [srcLarge] - Large image variant (~1800px)
 * @property {string} [fallbackSrc] - Fallback if other sources unavailable
 */

/**
 * @typedef {Object} PhotoData
 * @property {string} filename - Image filename (e.g., "IMG_9281.JPG")
 * @property {string} path - Primary image path
 * @property {string} [pathSmall] - Path to small variant
 * @property {string} [pathLarge] - Path to large variant
 * @property {string} [pathBlur] - Path to tiny blur placeholder
 * @property {number} [width] - Original width in pixels
 * @property {number} [height] - Original height in pixels
 * @property {number} [aspectRatio] - Aspect ratio (width/height)
 * @property {string} [albumSlug] - Album identifier
 * @property {string} [albumTitle] - Album display name
 * @property {number} [lat] - Latitude coordinate
 * @property {number} [lng] - Longitude coordinate
 * @property {string} [dateTaken] - ISO date string
 * @property {ExifData} [exif] - Camera metadata
 */

/**
 * @typedef {Object} ExifData
 * @property {string} [camera] - Camera model (e.g., "Canon EOS R5")
 * @property {string} [lens] - Lens model
 * @property {string} [focalLength] - Focal length (e.g., "24mm")
 * @property {string} [aperture] - Aperture value (e.g., "f/8.0")
 * @property {string} [shutterSpeed] - Shutter speed (e.g., "1/250s")
 * @property {number} [iso] - ISO value
 * @property {string} [description] - Image description
 * @property {string} [artist] - Photographer name
 * @property {string} [copyright] - Copyright info
 */

/**
 * @typedef {Object} BasePhotoProps
 * @property {string} src - Main image source URL (required)
 * @property {string} [srcSmall] - Small variant URL (~800px)
 * @property {string} [srcLarge] - Large variant URL (~1800px)
 * @property {string} alt - Alt text for accessibility (required)
 * @property {number} [width] - Image width in pixels
 * @property {number} [height] - Image height in pixels
 * @property {number} [aspectRatio] - Aspect ratio for layout reservation
 * @property {string} [sizes] - Responsive sizes attribute
 * @property {'lazy'|'eager'} [loading] - Loading strategy (default: 'lazy')
 * @property {'async'|'sync'|'auto'} [decoding] - Decode strategy (default: 'async')
 * @property {'high'|'low'|'auto'} [fetchPriority] - Fetch priority hint
 * @property {string} [className] - CSS class names
 * @property {React.CSSProperties} [style] - Inline styles
 * @property {(event: Event) => void} [onLoad] - Load event handler
 * @property {(event: Event) => void} [onError] - Error event handler
 * @property {(event: Event) => void} [onClick] - Click event handler
 */

/**
 * @typedef {Object} LazyImageProps
 * @extends BasePhotoProps
 * @property {string} [placeholderSrc] - Tiny blur-up placeholder image URL
 * @property {string} [placeholderColor] - Placeholder background color (default: '#0a0a0a')
 * @property {number} [threshold] - Intersection threshold 0-1 (default: 0.01)
 * @property {string} [rootMargin] - Root margin for intersection (default: '50px')
 * @property {number} [fadeInDuration] - Fade-in duration in ms (default: 300)
 * @property {boolean} [showSkeleton] - Show skeleton loader (default: true)
 */

/**
 * @typedef {Object} ImageUtilOptions
 * @property {number} [columns] - Number of grid columns
 * @property {'grid'|'masonry'|'full'} [layoutMode] - Layout type
 * @property {string} [baseUrl] - Base URL for images
 * @property {string} [sizes] - Responsive sizes string
 * @property {string} [className] - CSS class name
 * @property {boolean} [useLazyImage] - Use LazyImage component
 */

/**
 * @typedef {Object} LoadingStrategy
 * @property {'lazy'|'eager'} loading - Loading attribute value
 * @property {'high'|'low'|'auto'|undefined} fetchPriority - Fetch priority
 * @property {'async'|'sync'|'auto'} decoding - Decoding attribute value
 */

/**
 * @typedef {Object} LowQualityModeOptions
 * @property {number} [breakpoint] - Viewport width threshold (default: 768)
 * @property {boolean} [respectUserPreference] - Check user preferences
 */

/**
 * @typedef {Object} NetworkQualityInfo
 * @property {boolean} isSlowConnection - True if connection is slow
 * @property {string} effectiveType - Connection type (4g, 3g, 2g, slow-2g)
 * @property {number|null} downlink - Downlink speed in Mbps
 * @property {boolean} saveData - True if data saver is enabled
 */

/**
 * @typedef {Object} AdaptiveQualityResult
 * @property {boolean} shouldUseLowQuality - Whether to use low quality
 * @property {string} reason - Reason for quality decision
 * @property {boolean} isNarrowViewport - True if viewport is narrow
 * @property {boolean} isSlowConnection - True if connection is slow
 * @property {boolean} saveData - True if data saver enabled
 */

/**
 * @typedef {Object} AdaptiveQualityOptions
 * @property {number} [breakpoint] - Viewport width threshold
 * @property {boolean} [respectNetwork] - Consider network speed (default: true)
 */

/**
 * @typedef {Object} AlbumData
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Album title
 * @property {string} [description] - Album description
 * @property {string} cover - Cover image path
 * @property {number} [coverAspectRatio] - Cover aspect ratio
 * @property {number} count - Number of photos
 * @property {string} [date] - Display date
 * @property {string[]} [tags] - Album tags
 * @property {boolean} [isFavorite] - Favorite flag
 * @property {PhotoData[]} photos - Array of photos
 */

/**
 * @typedef {Object} TripData
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Trip title
 * @property {string} [summary] - Trip summary
 * @property {string} dateStart - ISO start date
 * @property {string} dateEnd - ISO end date
 * @property {string} [region] - Geographic region
 * @property {string} [coverImage] - Cover image path
 * @property {string[]} albumIds - Array of album slugs
 * @property {TripHighlight[]} [highlights] - Trip highlights
 * @property {TripRoute} [route] - Route information
 * @property {TripMediaItem[]} [media] - Supplemental media
 */

/**
 * @typedef {Object} TripHighlight
 * @property {string} id - Unique identifier
 * @property {string} title - Highlight title
 * @property {string} description - Description
 * @property {string} date - ISO date
 * @property {string} [image] - Image path
 * @property {number} [mapLat] - Map latitude
 * @property {number} [mapLng] - Map longitude
 */

/**
 * @typedef {Object} TripRoute
 * @property {Array<[number, number]>} polyline - Array of [lat, lng] coordinates
 */

/**
 * @typedef {Object} TripMediaItem
 * @property {'map-image'|'journal'|'video'|'artifact'|'collage'|'gpx'|'external-link'} type
 * @property {string} [src] - Media source path
 * @property {string} [caption] - Media caption
 * @property {string} [title] - Media title
 * @property {string} [href] - External link URL
 * @property {string} [label] - Link label
 */

// Export empty object to make this a module
export {};

