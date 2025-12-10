/**
 * Album Filtering Utilities
 * 
 * Provides helper functions for filtering albums based on various criteria.
 * All filters use AND logic when combined.
 */

/**
 * Check if album matches search query
 * Searches across: title, location name, tags, and date strings
 * @param {Object} album - Album object
 * @param {string} query - Search query string
 * @returns {boolean}
 */
export function matchesSearch(album, query) {
  if (!query || query.trim() === '') return true;
  
  const searchLower = query.toLowerCase().trim();
  
  // Search in title
  if (album.title?.toLowerCase().includes(searchLower)) return true;
  
  // Search in location name
  if (album.primaryLocation?.name?.toLowerCase().includes(searchLower)) return true;
  
  // Search in tags
  if (album.tags?.some(tag => tag.toLowerCase().includes(searchLower))) return true;
  
  // Search in dates
  if (album.date?.includes(searchLower)) return true;
  if (album.startDate?.includes(searchLower)) return true;
  if (album.endDate?.includes(searchLower)) return true;
  
  return false;
}

/**
 * Check if album matches favorites filter
 * @param {Object} album - Album object
 * @param {boolean} isActive - Whether favorites filter is active
 * @returns {boolean}
 */
export function matchesFavorites(album, isActive) {
  if (!isActive) return true;
  return album.isFavorite === true;
}

/**
 * Check if album's date range overlaps with selected date range
 * @param {Object} album - Album object
 * @param {string|null} dateFrom - Start date (YYYY-MM-DD)
 * @param {string|null} dateTo - End date (YYYY-MM-DD)
 * @returns {boolean}
 */
export function matchesDateRange(album, dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return true;
  
  const albumStart = album.startDate || album.date;
  const albumEnd = album.endDate || album.date;
  
  if (!albumStart) return false;
  
  const albumStartDate = new Date(albumStart);
  const albumEndDate = albumEnd ? new Date(albumEnd) : albumStartDate;
  
  // Check if album's date range overlaps with filter range
  if (dateFrom && dateTo) {
    const filterStart = new Date(dateFrom);
    const filterEnd = new Date(dateTo);
    // Ranges overlap if album ends after filter starts AND album starts before filter ends
    return albumEndDate >= filterStart && albumStartDate <= filterEnd;
  } else if (dateFrom) {
    const filterStart = new Date(dateFrom);
    // Album must end on or after the filter start date
    return albumEndDate >= filterStart;
  } else if (dateTo) {
    const filterEnd = new Date(dateTo);
    // Album must start on or before the filter end date
    return albumStartDate <= filterEnd;
  }
  
  return true;
}

/**
 * Check if album's date range intersects with selected year
 * @param {Object} album - Album object
 * @param {string|null} year - Selected year (YYYY format)
 * @returns {boolean}
 */
export function matchesYear(album, year) {
  if (!year) return true;
  
  // Try to use startDate/endDate first, fall back to date
  const start = album.startDate || album.date;
  const end = album.endDate || album.date;
  
  if (!start) return false;
  
  const yearNum = parseInt(year, 10);
  const startYear = parseInt(start.substring(0, 4), 10);
  const endYear = end ? parseInt(end.substring(0, 4), 10) : startYear;
  
  // Album matches if year falls within its date range
  return yearNum >= startYear && yearNum <= endYear;
}

/**
 * Check if album's location matches selected location
 * @param {Object} album - Album object
 * @param {string|null} locationName - Selected location name
 * @returns {boolean}
 */
export function matchesLocation(album, locationName) {
  if (!locationName) return true;
  return album.primaryLocation?.name === locationName;
}

/**
 * Check if album has ALL selected tags (AND logic)
 * @param {Object} album - Album object
 * @param {Array<string>} selectedTags - Array of selected tag names
 * @returns {boolean}
 */
export function matchesTags(album, selectedTags) {
  if (!selectedTags || selectedTags.length === 0) return true;
  if (!album.tags || album.tags.length === 0) return false;
  
  // Album must have ALL selected tags
  return selectedTags.every(selectedTag => 
    album.tags.includes(selectedTag)
  );
}

/**
 * Main filtering pipeline - applies all filters with AND logic
 * @param {Array} albums - Array of album objects
 * @param {Object} filters - Filter state object
 * @param {string} filters.searchQuery - Search query
 * @param {boolean} filters.showFavorites - Favorites filter active
 * @param {string|null} filters.dateFrom - Date range start
 * @param {string|null} filters.dateTo - Date range end
 * @param {string|null} filters.selectedYear - Selected year
 * @param {string|null} filters.selectedLocation - Selected location
 * @param {Array<string>} filters.selectedTags - Selected tags
 * @returns {Array} Filtered albums
 */
export function filterAlbums(albums, filters) {
  if (!albums || albums.length === 0) return [];
  
  return albums
    .filter(album => matchesSearch(album, filters.searchQuery))
    .filter(album => matchesFavorites(album, filters.showFavorites))
    .filter(album => matchesDateRange(album, filters.dateFrom, filters.dateTo))
    .filter(album => matchesYear(album, filters.selectedYear))
    .filter(album => matchesLocation(album, filters.selectedLocation))
    .filter(album => matchesTags(album, filters.selectedTags));
}

/**
 * Extract unique years from albums for year filter dropdown
 * @param {Array} albums - Array of album objects
 * @returns {Array<string>} Sorted array of unique years (descending)
 */
export function getUniqueYears(albums) {
  const years = new Set();
  
  albums.forEach(album => {
    const start = album.startDate || album.date;
    const end = album.endDate || album.date;
    
    if (start) {
      const startYear = start.substring(0, 4);
      years.add(startYear);
    }
    
    if (end && end !== start) {
      const endYear = end.substring(0, 4);
      years.add(endYear);
    }
  });
  
  return Array.from(years).sort().reverse();
}

/**
 * Extract unique location names from albums for location filter
 * @param {Array} albums - Array of album objects
 * @returns {Array<string>} Sorted array of unique location names
 */
export function getUniqueLocations(albums) {
  const locations = new Set();
  
  albums.forEach(album => {
    if (album.primaryLocation?.name) {
      locations.add(album.primaryLocation.name);
    }
  });
  
  return Array.from(locations).sort();
}

/**
 * Extract all unique tags from albums for tag filter
 * @param {Array} albums - Array of album objects
 * @returns {Array<string>} Sorted array of unique tags
 */
export function getUniqueTags(albums) {
  const tags = new Set();
  
  albums.forEach(album => {
    if (album.tags && Array.isArray(album.tags)) {
      album.tags.forEach(tag => tags.add(tag));
    }
  });
  
  return Array.from(tags).sort();
}

