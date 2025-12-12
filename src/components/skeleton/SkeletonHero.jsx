import SkeletonText from './SkeletonText';
import SkeletonImage from './SkeletonImage';
import './Skeleton.css';

export default function SkeletonHero() {
  return (
    <div className="skeleton-hero">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <SkeletonText lines={2} lineHeight="1.8rem" variant="light" />
        <SkeletonText lines={3} lineHeight="1rem" />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SkeletonImage aspectRatio={4} className="skeleton-inline" />
          <SkeletonImage aspectRatio={4} className="skeleton-inline" />
        </div>
      </div>

      <div className="skeleton-hero-images">
        <HeroBubble className="hero-bubble-1" width="42%" height="80%" />
        <HeroBubble className="hero-bubble-2" width="38%" height="38%" />
        <HeroBubble className="hero-bubble-3" width="32%" height="32%" />
        <HeroBubble className="hero-bubble-4" width="34%" height="46%" />
        <HeroBubble className="hero-bubble-5" width="36%" height="36%" />
      </div>
    </div>
  );
}

function HeroBubble({ className, width, height }) {
  return (
    <div
      className={`skeleton-hero-bubble ${className || ''}`}
      style={{ width, height }}
    >
      <SkeletonImage aspectRatio={1} />
    </div>
  );
}

