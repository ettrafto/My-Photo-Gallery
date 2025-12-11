import Hero from '../components/Hero';
import AlbumGrid from '../components/AlbumGrid';
import './Page.css';

export default function Home() {
  return (
    <>
      <Hero />
      <main className="page-shell">
        <AlbumGrid />
      </main>
    </>
  );
}

