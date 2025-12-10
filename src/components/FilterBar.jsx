import { useState, useEffect, useRef } from 'react';
import './FilterBar.css';

/**
 * FilterBar component - contains all filter controls
 * @param {Object} props
 * @param {Object} props.filters - Current filter state
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Array<string>} props.availableYears - List of available years
 * @param {Array<string>} props.availableLocations - List of available locations
 * @param {Array<string>} props.availableTags - List of available tags
 */
export default function FilterBar({
  filters,
  onFilterChange,
  availableYears = [],
  availableLocations = [],
  availableTags = []
}) {
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  
  const tagDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  const hasActiveFilters = filters.showFavorites || 
                          filters.selectedYear || 
                          filters.selectedLocation || 
                          filters.selectedTags?.length > 0 ||
                          filters.dateFrom ||
                          filters.dateTo;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target)) {
        setTagDropdownOpen(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClearAll = () => {
    onFilterChange({
      searchQuery: '',
      showFavorites: false,
      selectedYear: null,
      selectedLocation: null,
      selectedTags: [],
      dateFrom: null,
      dateTo: null
    });
  };

  const toggleTag = (tag) => {
    const currentTags = filters.selectedTags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onFilterChange({ ...filters, selectedTags: newTags });
  };

  const removeTag = (tag) => {
    const newTags = (filters.selectedTags || []).filter(t => t !== tag);
    onFilterChange({ ...filters, selectedTags: newTags });
  };

  const filteredLocations = availableLocations.filter(loc =>
    loc.toLowerCase().includes(locationSearch.toLowerCase())
  );

  return (
    <div className="filter-bar">
      {/* Date range selector - first row */}
      <div className="filter-row date-selector-row">
        <label className="date-label">
          From:
          <input
            type="date"
            className="date-input"
            value={filters.dateFrom || ''}
            onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value || null })}
          />
        </label>
        <label className="date-label">
          To:
          <input
            type="date"
            className="date-input"
            value={filters.dateTo || ''}
            onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value || null })}
          />
        </label>
        {(filters.dateFrom || filters.dateTo) && (
          <button
            className="clear-date-btn"
            onClick={() => onFilterChange({ ...filters, dateFrom: null, dateTo: null })}
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Main filter buttons - second row */}
      <div className="filter-row filter-controls">
        <button
          className={`filter-btn ${filters.showFavorites ? 'active' : ''}`}
          onClick={() => onFilterChange({ ...filters, showFavorites: !filters.showFavorites })}
        >
          ⭐ Favorites
        </button>

        {/* Tags multi-select */}
        {availableTags.length > 0 && (
          <div className="filter-dropdown-container" ref={tagDropdownRef}>
            <button
              className={`filter-btn ${filters.selectedTags?.length > 0 ? 'active' : ''}`}
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            >
              🏷️ Tags {filters.selectedTags?.length > 0 ? `(${filters.selectedTags.length})` : ''}
            </button>
            {tagDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-options">
                  {availableTags.map(tag => (
                    <label key={tag} className="dropdown-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.selectedTags?.includes(tag) || false}
                        onChange={() => toggleTag(tag)}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Year dropdown */}
        {availableYears.length > 0 && (
          <select
            className="filter-dropdown"
            value={filters.selectedYear || ''}
            onChange={(e) => onFilterChange({ ...filters, selectedYear: e.target.value || null })}
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        )}

        {/* Location dropdown */}
        {availableLocations.length > 0 && (
          <div className="filter-dropdown-container" ref={locationDropdownRef}>
            <button
              className={`filter-btn ${filters.selectedLocation ? 'active' : ''}`}
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
            >
              📍 {filters.selectedLocation || 'Location'}
            </button>
            {locationDropdownOpen && (
              <div className="dropdown-menu">
                <input
                  type="text"
                  className="dropdown-search"
                  placeholder="Search locations..."
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="dropdown-options">
                  <div
                    className="dropdown-option"
                    onClick={() => {
                      onFilterChange({ ...filters, selectedLocation: null });
                      setLocationDropdownOpen(false);
                      setLocationSearch('');
                    }}
                  >
                    All Locations
                  </div>
                  {filteredLocations.map(location => (
                    <div
                      key={location}
                      className={`dropdown-option ${filters.selectedLocation === location ? 'active' : ''}`}
                      onClick={() => {
                        onFilterChange({ ...filters, selectedLocation: location });
                        setLocationDropdownOpen(false);
                        setLocationSearch('');
                      }}
                    >
                      {location}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="active-filters">
          {filters.showFavorites && (
            <span className="filter-chip" onClick={() => onFilterChange({ ...filters, showFavorites: false })}>
              ⭐ Favorites ×
            </span>
          )}
          {filters.dateFrom && (
            <span className="filter-chip" onClick={() => onFilterChange({ ...filters, dateFrom: null })}>
              From: {filters.dateFrom} ×
            </span>
          )}
          {filters.dateTo && (
            <span className="filter-chip" onClick={() => onFilterChange({ ...filters, dateTo: null })}>
              To: {filters.dateTo} ×
            </span>
          )}
          {filters.selectedYear && (
            <span className="filter-chip" onClick={() => onFilterChange({ ...filters, selectedYear: null })}>
              {filters.selectedYear} ×
            </span>
          )}
          {filters.selectedLocation && (
            <span className="filter-chip" onClick={() => onFilterChange({ ...filters, selectedLocation: null })}>
              📍 {filters.selectedLocation} ×
            </span>
          )}
          {filters.selectedTags?.map(tag => (
            <span key={tag} className="filter-chip" onClick={() => removeTag(tag)}>
              🏷️ {tag} ×
            </span>
          ))}
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

