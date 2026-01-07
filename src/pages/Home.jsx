import Hero from '../components/Hero';
import FavoriteAlbum from '../components/FavoriteAlbum';
import FavoriteTrip from '../components/FavoriteTrip';
import Showcase from '../components/Showcase';
import Globe from '../components/Globe';
import './Page.css';

export default function Home() {
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
      </main>
    </>
  );
}

