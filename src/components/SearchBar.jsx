import { useState } from 'react';
import './SearchBar.css';

/**
 * SearchBar component - submit-only search (not live)
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onSearch - Callback when search is submitted (query) => void
 */
export default function SearchBar({ value, onSearch }) {
  const [inputValue, setInputValue] = useState(value || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(inputValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="search-input"
        placeholder="Search albums..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" className="search-button">
        Search
      </button>
    </form>
  );
}

