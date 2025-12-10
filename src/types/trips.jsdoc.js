/**
 * @file JSDoc type definitions for Trips system
 * These types document the structure of trip data and related objects
 */

/**
 * @typedef {'map-image'|'journal'|'video'|'artifact'|'gpx'|'collage'|'external-link'} TripMediaType
 */

/**
 * @typedef {Object} TripMediaItem
 * @property {TripMediaType} type - Type of media item
 * @property {string} [src] - Source path for media files
 * @property {string} [caption] - Caption or description
 * @property {string} [title] - Title (for journals, etc.)
 * @property {string} [href] - URL for external links
 * @property {string} [label] - Display text for external links
 */

/**
 * @typedef {Object} TripHighlight
 * @property {string} id - Unique identifier for the highlight
 * @property {string} title - Title of the highlight moment
 * @property {string} description - Longer description
 * @property {string} date - ISO date string (YYYY-MM-DD)
 * @property {string} [image] - Path to highlight image
 * @property {string} [albumSlug] - Associated album slug
 * @property {string} [photoFilename] - Specific photo filename
 * @property {number} [mapLat] - Latitude for map location
 * @property {number} [mapLng] - Longitude for map location
 */

/**
 * @typedef {Object} TripRoutePoint
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} [label] - Optional label for this point
 */

/**
 * @typedef {Object} TripRoute
 * @property {TripRoutePoint[]} [polyline] - Array of route points
 * @property {string} [gpxFile] - Path to GPX file
 */

/**
 * @typedef {Object} TripMiscImage
 * @property {string} src - Image source path
 * @property {string} [caption] - Image caption
 * @property {string[]} [tags] - Tags for categorization
 */

/**
 * @typedef {Object} Trip
 * @property {string} slug - URL-safe identifier
 * @property {string} title - Display title
 * @property {string} dateStart - ISO date string (YYYY-MM-DD)
 * @property {string} dateEnd - ISO date string (YYYY-MM-DD)
 * @property {string} [region] - Geographic region
 * @property {string} [summary] - Trip summary/description
 * @property {string} [coverImage] - Path to cover image
 * @property {boolean} [useFirstAlbumCoverIfMissing] - Fallback to first album cover
 * @property {string[]} albumIds - Array of album IDs included in this trip
 * @property {TripMiscImage[]} [miscImages] - Additional non-album images
 * @property {TripRoute} [route] - Route/path information
 * @property {TripHighlight[]} [highlights] - Key moments/highlights
 * @property {TripMediaItem[]} [media] - Supplemental media items
 */

/**
 * @typedef {Object} Photo
 * Photo object from map.json
 * @property {string} albumSlug - Album identifier
 * @property {string} albumTitle - Album title
 * @property {string} filename - Photo filename
 * @property {string} path - Relative path to photo
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} [accuracy] - GPS accuracy ('exif'|'album-default')
 * @property {string} [dateTaken] - ISO date string
 * @property {string[]} [tags] - Photo tags
 */

export {};

