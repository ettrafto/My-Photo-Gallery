import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TripCard.css';

/**
 * TripCard component displays a summary card for a trip
 * @param {Object} props
 * @param {import('../types/trips.jsdoc').Trip} props.trip - Trip data
 */
export default function TripCard({ trip }) {
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculate trip duration
  const startDate = new Date(trip.dateStart);
  const endDate = new Date(trip.dateEnd);
  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Format date range for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  // Load cover image
  useEffect(() => {
    async function loadCoverImage() {
      setLoading(true);

      // Use trip's coverImage if provided
      if (trip.coverImage) {
        setCoverImageUrl(`${import.meta.env.BASE_URL}${trip.coverImage}`);
        setLoading(false);
        return;
      }

      // Fallback: load first album's cover if requested
      if (trip.useFirstAlbumCoverIfMissing && trip.albumIds && trip.albumIds.length > 0) {
        try {
          const firstAlbumSlug = trip.albumIds[0];
          const albumData = await fetch(`${import.meta.env.BASE_URL}content/albums/${firstAlbumSlug}.json`)
            .then(res => res.json());
          
          if (albumData.cover) {
            setCoverImageUrl(`${import.meta.env.BASE_URL}${albumData.cover}`);
          }
        } catch (err) {
          console.error('Failed to load album cover:', err);
        }
      }

      setLoading(false);
    }

    loadCoverImage();
  }, [trip]);

  return (
    <Link to={`/trips/${trip.slug}`} className="trip-card">
      <div className="trip-card-image-wrap">
        {loading ? (
          <div className="trip-card-image-placeholder">
            <span>Loading...</span>
          </div>
        ) : coverImageUrl ? (
          <img 
            src={coverImageUrl} 
            alt={trip.title} 
            className="trip-card-image"
            loading="lazy"
          />
        ) : (
          <div className="trip-card-image-placeholder">
            <span>No Image</span>
          </div>
        )}
      </div>

      <div className="trip-card-content">
        <h3 className="trip-card-title">{trip.title}</h3>
        
        <div className="trip-card-meta">
          <span className="trip-card-dates">{dateRange}</span>
          {trip.region && <span className="trip-card-region">{trip.region}</span>}
        </div>

        {trip.summary && (
          <p className="trip-card-summary">{trip.summary}</p>
        )}

        <div className="trip-card-stats">
          <span className="trip-card-stat">{durationDays} days</span>
          <span className="trip-card-stat">{trip.albumIds.length} albums</span>
        </div>
      </div>
    </Link>
  );
}

