import { useSEO } from '../hooks/useSEO';
import Hero from '../components/Hero';
import FavoriteAlbum from '../components/FavoriteAlbum';
import FavoriteTrip from '../components/FavoriteTrip';
import Showcase from '../components/Showcase';
import Globe from '../components/Globe';
import YouTubeCard from '../components/YouTubeCard';
import './Page.css';

export default function Home() {
  useSEO({ 
    pageTitle: "Home",
    description: "A minimal photo archive of trips, places, and light. Explore photography collections from adventures around the world."
  });

  return (
    <>
      <Hero />
      <main className="page-shell">
        <Globe />
        <Showcase />
        <div className="highlights-section">
          <FavoriteAlbum />
          <FavoriteTrip />
        </div>
        <YouTubeCard />
      </main>
    </>
  );
}

