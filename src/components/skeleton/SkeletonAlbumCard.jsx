import SkeletonImage from './SkeletonImage';
import SkeletonText from './SkeletonText';
import SkeletonBlock from './SkeletonBlock';
import './Skeleton.css';

export default function SkeletonAlbumCard() {
  return (
    <div className="skeleton-card">
      <SkeletonImage aspectRatio={1.5} rounded={10} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <SkeletonBlock width="60%" height="1.1rem" variant="light" />
        <SkeletonText lines={2} lineHeight="0.8rem" />
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <SkeletonBlock width="30%" height="0.8rem" rounded={999} />
          <SkeletonBlock width="22%" height="0.8rem" rounded={999} />
          <SkeletonBlock width="18%" height="0.8rem" rounded={999} />
        </div>
      </div>
    </div>
  );
}

