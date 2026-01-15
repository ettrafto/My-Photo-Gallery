import { useSEO } from '../hooks/useSEO';
import AlbumGrid from '../components/AlbumGrid';
import './Page.css';

export default function Albums() {
  useSEO({ 
    pageTitle: "Albums",
    description: "Browse photo albums organized by location, date, and theme. Each album contains curated images from specific places and moments."
  });

  return (
    <main className="page-shell">
      <AlbumGrid />
    </main>
  );
}

