/**
 * @typedef {Object} PrimaryLocation
 * @property {string} name - Location name (e.g., "Death Valley" or "Barcelona")
 * @property {number|null} lat - Latitude
 * @property {number|null} lng - Longitude
 */

/**
 * @typedef {Object} PhotoExif
 * @property {string|null} camera - Camera make and model
 * @property {string|null} lens - Lens model
 * @property {string|null} aperture - Aperture (e.g., "f/2.8")
 * @property {string|null} shutterSpeed - Shutter speed (e.g., "1/250s")
 * @property {number|null} iso - ISO value
 * @property {string|null} focalLength - Focal length (e.g., "24mm")
 * @property {string|null} dateTaken - ISO date string when photo was taken
 * @property {string|null} copyright - Copyright info
 * @property {string|null} artist - Artist/photographer name
 * @property {string|null} description - Photo description
 */

/**
 * @typedef {Object} Photo
 * @property {string} filename - Image filename
 * @property {string} path - Relative path to image
 * @property {number|null} lat - GPS latitude from EXIF
 * @property {number|null} lng - GPS longitude from EXIF
 * @property {number|null} width - Image width in pixels
 * @property {number|null} height - Image height in pixels
 * @property {number} aspectRatio - Width/height ratio
 * @property {PhotoExif} exif - EXIF metadata
 */

/**
 * @typedef {Object} Album
 * @property {string} id - Unique album identifier (same as slug)
 * @property {string} slug - URL-friendly slug
 * @property {string} title - Album title
 * @property {string|null} description - Album description
 * @property {string[]} tags - Array of tags (manual + auto-generated)
 * @property {string|null} date - Legacy single date field (YYYY-MM-DD)
 * @property {string|null} startDate - First photo date (YYYY-MM-DD)
 * @property {string|null} endDate - Last photo date (YYYY-MM-DD)
 * @property {string} cover - Path to cover image
 * @property {number} coverAspectRatio - Cover image aspect ratio
 * @property {number} count - Number of photos in album
 * @property {boolean} isFavorite - Whether album is marked as favorite
 * @property {PrimaryLocation} primaryLocation - Representative location for the album
 * @property {Photo[]} [photos] - Array of photos (only in full album JSON, not in index)
 */

/**
 * @typedef {Object} Trip
 * @property {string} id - Trip identifier (slug)
 * @property {string} slug - URL-friendly slug
 * @property {string} title - Trip title
 * @property {string} dateStart - Trip start date (YYYY-MM-DD)
 * @property {string} dateEnd - Trip end date (YYYY-MM-DD)
 * @property {string} region - Geographic region
 * @property {string} summary - Trip description
 * @property {string[]} albumIds - Array of album IDs included in this trip
 */

/**
 * @typedef {Object} FilterState
 * @property {string} searchQuery - Search text input
 * @property {boolean} showFavorites - Filter to favorites only
 * @property {string|null} dateFrom - Date range start (YYYY-MM-DD)
 * @property {string|null} dateTo - Date range end (YYYY-MM-DD)
 * @property {string|null} selectedYear - Selected year filter (YYYY)
 * @property {string|null} selectedLocation - Selected location name
 * @property {string[]} selectedTags - Array of selected tags (AND logic)
 */

export {};

