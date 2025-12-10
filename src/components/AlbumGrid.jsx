import { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import AlbumCard from './AlbumCard';
import { filterAlbums, getUniqueYears, getUniqueLocations, getUniqueTags } from '../utils/albumFilters';
import './AlbumGrid.css';

export default function AlbumGrid() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchQuery: '',
    showFavorites: false,
    dateFrom: null,
    dateTo: null,
    selectedYear: null,
    selectedLocation: null,
    selectedTags: []
  });

  // Load albums data
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}content/albums.json`)
      .then(res => res.json())
      .then(albumsData => {
        const albumsList = albumsData.albums || [];
        
        // Load full album data (with photos) for each album to enable collage
        const albumPromises = albumsList.map(album =>
          fetch(`${import.meta.env.BASE_URL}content/albums/${album.slug}.json`)
            .then(res => res.json())
            .catch(() => album) // Fall back to summary if full data fails
        );
        
        return Promise.all(albumPromises).then(fullAlbums => {
          setAlbums(fullAlbums);
          setLoading(false);
        });
      })
      .catch(err => {
        console.error('Failed to load albums:', err);
        setLoading(false);
      });
  }, []);

  // Compute unique values for filter dropdowns
  const availableYears = getUniqueYears(albums);
  const availableLocations = getUniqueLocations(albums);
  const availableTags = getUniqueTags(albums);

  // Apply filters
  const filteredAlbums = filterAlbums(albums, filters);

  if (loading) {
    return <div className="loading">Loading albums...</div>;
  }

  if (albums.length === 0) {
    return (
      <div className="empty-state">
        <h2>No albums yet</h2>
        <p>Add images to <code>/public/images/</code> and run <code>npm run scan</code></p>
      </div>
    );
  }

  return (
    <div className="album-grid-container">
      <header className="gallery-header">
        <h1>Photo Gallery</h1>
        <p className="subtitle">
          {filteredAlbums.length} of {albums.length} album{albums.length !== 1 ? 's' : ''}
        </p>
      </header>

      <SearchBar 
        value={filters.searchQuery}
        onSearch={(query) => setFilters({ ...filters, searchQuery: query })}
      />

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        availableYears={availableYears}
        availableLocations={availableLocations}
        availableTags={availableTags}
      />

      <div className="album-grid">
        {filteredAlbums.map(album => (
          <AlbumCard key={album.slug} album={album} />
        ))}
      </div>

      {filteredAlbums.length === 0 && (
        <div className="empty-state">
          <h2>No albums match your filters</h2>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}


