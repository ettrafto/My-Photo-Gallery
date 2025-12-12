import SkeletonBar from './SkeletonBar';
import SkeletonBlock from './SkeletonBlock';
import SkeletonAlbumCard from './SkeletonAlbumCard';
import './Skeleton.css';

export default function SkeletonAlbumGrid({ cards = 8 }) {
  return (
    <div className="album-grid-skeleton">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <SkeletonBar width="220px" height="1.6rem" variant="light" />
        <SkeletonBlock width="180px" height="1rem" />
      </div>

      <div className="skeleton-album-grid">
        {Array.from({ length: cards }).map((_, idx) => (
          <SkeletonAlbumCard key={idx} />
        ))}
      </div>
    </div>
  );
}

