import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { loadSiteConfig } from '../lib/siteConfig';
import Photo from './Photo';
import './FavoriteTrip.css';

/**
 * FavoriteTrip component - displays favorite trip highlight
 * Loads trip data from site.json favorites.trip.slug
 */
export default function FavoriteTrip() {
  const [trip, setTrip] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    async function loadFavoriteTrip() {
      try {
        const siteConfig = await loadSiteConfig();
        const favoriteConfig = siteConfig?.favorites?.trip;

        if (!favoriteConfig || !favoriteConfig.enabled || !favoriteConfig.slug) {
          setEnabled(false);
          setLoading(false);
          return;
        }

        setEnabled(true);

        // Load trip data
        const tripResponse = await fetch(
          `${import.meta.env.BASE_URL}content/trips/${favoriteConfig.slug}.json`
        );

        if (!tripResponse.ok) {
          throw new Error(`Failed to load trip: ${tripResponse.status}`);
        }

        const tripData = await tripResponse.json();
        setTrip(tripData);

        // Load cover image
        if (tripData.coverImage) {
          setCoverImageUrl(`${import.meta.env.BASE_URL}${tripData.coverImage}`);
        } else if (tripData.useFirstAlbumCoverIfMissing && tripData.albumIds?.length > 0) {
          try {
            const firstAlbumSlug = tripData.albumIds[0];
            const albumData = await fetch(
              `${import.meta.env.BASE_URL}content/albums/${firstAlbumSlug}.json`
            ).then(res => res.json());

            if (albumData.cover) {
              setCoverImageUrl(`${import.meta.env.BASE_URL}${albumData.cover}`);
            }
          } catch (err) {
            console.error('Failed to load album cover:', err);
          }
        }
      } catch (err) {
        console.error('Failed to load favorite trip:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadFavoriteTrip();
  }, []);

  // Don't render if not enabled
  if (!enabled) {
    return null;
  }

  if (loading) {
    return (
      <div className="favorite-trip-wrapper">
        <div className="favorite-trip-header">
          <div className="favorite-trip-label-header">Featured Trip</div>
          <div className="favorite-trip-line"></div>
        </div>
        <div className="favorite-trip">
          <div className="favorite-trip-skeleton">
            <div className="favorite-trip-skeleton-image" />
            <div className="favorite-trip-skeleton-content">
              <div className="favorite-trip-skeleton-title" />
              <div className="favorite-trip-skeleton-text" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="favorite-trip-wrapper">
        <div className="favorite-trip-header">
          <div className="favorite-trip-label-header">Featured Trip</div>
          <div className="favorite-trip-line"></div>
        </div>
        <div className="favorite-trip">
          <div className="favorite-trip-content">
            <p className="favorite-trip-error">
              {error || 'Trip not found'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate trip duration
  const startDate = new Date(trip.dateStart);
  const endDate = new Date(trip.dateEnd);
  const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Format date range
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  const dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  return (
    <div className="favorite-trip-wrapper">
      <div className="favorite-trip-header">
        <div className="favorite-trip-label-header">Featured Trip</div>
        <div className="favorite-trip-line"></div>
      </div>
      <Link to={`/trips/${trip.slug}`} className="favorite-trip">
        <div className="favorite-trip-cover">
          {coverImageUrl ? (
            <Photo
              src={coverImageUrl}
              alt={trip.title}
              className="favorite-trip-cover-image"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="favorite-trip-cover-placeholder">
              <span>No Image</span>
            </div>
          )}
        </div>
        <div className="favorite-trip-content">
          <h2 className="favorite-trip-title">{trip.title}</h2>
        {trip.summary && (
          <p className="favorite-trip-description">{trip.summary}</p>
        )}
        <div className="favorite-trip-meta">
          {trip.region && (
            <span className="favorite-trip-region">{trip.region}</span>
          )}
          <span className="favorite-trip-date">{dateRange}</span>
          <span className="favorite-trip-duration">{durationDays} days</span>
        </div>
      </div>
      </Link>
    </div>
  );
}
