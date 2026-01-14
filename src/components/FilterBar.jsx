import { useState, useEffect, useRef } from 'react';
import DateFilterPresets from './DateFilterPresets';
import YearDropdown from './YearDropdown';
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
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'last12months' | 'thisyear'
  
  const tagDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Helper to get preset label (must be defined before use)
  const getPresetLabel = (preset) => {
    const labels = {
      'all': 'All time',
      'last12months': 'Last 12 months',
      'thisyear': 'This year'
    };
    return labels[preset] || 'All time';
  };

  // Determine active date filter for chips
  const activeDateFilter = filters.selectedYear 
    ? `Year: ${filters.selectedYear}`
    : datePreset !== 'all' 
      ? getPresetLabel(datePreset)
      : null;

  const hasActiveFilters = filters.showFavorites || 
                          filters.selectedYear || 
                          filters.selectedLocation || 
                          filters.selectedTags?.length > 0 ||
                          datePreset !== 'all';

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

  // Calculate date range from preset
  const calculateDateRange = (preset) => {
    const now = new Date();
    
    switch (preset) {
      case 'last12months': {
        const fromDate = new Date(now);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        return {
          dateFrom: fromDate.toISOString().split('T')[0],
          dateTo: now.toISOString().split('T')[0]
        };
      }
      case 'thisyear': {
        return {
          dateFrom: `${now.getFullYear()}-01-01`,
          dateTo: `${now.getFullYear()}-12-31`
        };
      }
      case 'all':
      default:
        return { dateFrom: null, dateTo: null };
    }
  };

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const dateRange = calculateDateRange(preset);
    onFilterChange({
      ...filters,
      ...dateRange,
      selectedYear: null // Clear year when preset is selected
    });
  };

  const handleYearChange = (year) => {
    if (year) {
      setDatePreset('all'); // Clear preset when year is selected
      onFilterChange({
        ...filters,
        selectedYear: year,
        dateFrom: null,
        dateTo: null
      });
    } else {
      onFilterChange({
        ...filters,
        selectedYear: null
      });
    }
  };

  const handleClearAll = () => {
    setDatePreset('all');
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

  const handleClearDateFilter = () => {
    setDatePreset('all');
    onFilterChange({
      ...filters,
      selectedYear: null,
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
      {/* All filters on one row */}
      <div className="filter-row unified-filter-row">
        {/* Main filters section */}
        <div className="main-filters-section">
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

        {/* Vertical separator */}
        <div className="filter-separator"></div>

        {/* Date filters section */}
        <div className="date-filters-section">
          <DateFilterPresets
            activePreset={datePreset}
            onPresetChange={handlePresetChange}
          />
          
          <YearDropdown
            selectedYear={filters.selectedYear}
            availableYears={availableYears}
            onYearChange={handleYearChange}
          />
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="active-filters">
          {filters.showFavorites && (
            <span className="filter-chip" onClick={() => onFilterChange({ ...filters, showFavorites: false })}>
              ⭐ Favorites ×
            </span>
          )}
          {activeDateFilter && (
            <span className="filter-chip" onClick={handleClearDateFilter}>
              📅 {activeDateFilter} ×
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

