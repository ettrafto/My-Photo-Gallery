import { useState, useRef, useEffect } from 'react';
import './YearDropdown.css';

/**
 * YearDropdown - Modern year selector with floating dropdown
 * @param {Object} props
 * @param {string|null} props.selectedYear - Currently selected year
 * @param {Array<string>} props.availableYears - List of available years
 * @param {Function} props.onYearChange - Callback when year changes (year) => void
 */
export default function YearDropdown({ selectedYear, availableYears = [], onYearChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearSelect = (year) => {
    onYearChange(year);
    setIsOpen(false);
  };

  return (
    <div className="year-dropdown-container" ref={dropdownRef}>
      <button
        className={`year-dropdown-trigger ${selectedYear ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="year-label">Year:</span>
        <span className="year-value">{selectedYear || 'Select'}</span>
        <span className={`year-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="year-dropdown-menu">
          {availableYears.map(year => (
            <div
              key={year}
              className={`year-option ${selectedYear === year ? 'selected' : ''}`}
              onClick={() => handleYearSelect(year)}
            >
              <span>{year}</span>
              {selectedYear === year && <span className="check-mark">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

