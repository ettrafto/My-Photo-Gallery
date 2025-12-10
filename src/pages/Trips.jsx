import { useState, useEffect } from 'react';
import { TRIP_SLUGS } from '../data/trips';
import TripCard from '../components/TripCard';
import './Page.css';
import './Trips.css';

/**
 * Trips index page - displays all available trips
 */
export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all trip data
  useEffect(() => {
    async function loadTrips() {
      setLoading(true);
      setError(null);

      try {
        const tripPromises = TRIP_SLUGS.map(async (slug) => {
          const response = await fetch(`${import.meta.env.BASE_URL}content/trips/${slug}.json`);
          if (!response.ok) throw new Error(`Failed to load trip: ${slug}`);
          return response.json();
        });

        const loadedTrips = await Promise.all(tripPromises);
        
        // Sort by start date (most recent first)
        loadedTrips.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart));
        
        setTrips(loadedTrips);
      } catch (err) {
        console.error('Failed to load trips:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, []);

  return (
    <main className="page-shell">
      {/* Hero section */}
      <section className="page-block">
        <p className="page-label">trips</p>
        <h1 className="page-title">Photo trips</h1>
        <p className="page-body">
          Journeys through beautiful places. Each trip brings together albums from a specific adventure, 
          showing the route, highlights, and stories along the way.
        </p>
      </section>

      {/* Loading state */}
      {loading && (
        <section className="page-block">
          <p className="trips-loading">Loading trips...</p>
        </section>
      )}

      {/* Error state */}
      {error && (
        <section className="page-block">
          <p className="trips-error">Error loading trips: {error}</p>
        </section>
      )}

      {/* Trips grid */}
      {!loading && !error && trips.length > 0 && (
        <section className="trips-grid">
          {trips.map((trip) => (
            <TripCard key={trip.slug} trip={trip} />
          ))}
        </section>
      )}

      {/* Empty state */}
      {!loading && !error && trips.length === 0 && (
        <section className="page-block">
          <p className="page-body">No trips found. Check back soon!</p>
        </section>
      )}
    </main>
  );
}

