import SkeletonImage from './SkeletonImage';
import './Skeleton.css';

export default function SkeletonImageGrid({
  count = 12,
  layoutMode = 'grid',
  imagesAcross = 3,
}) {
  const isMasonry = layoutMode === 'masonry';
  const style = isMasonry
    ? undefined
    : { gridTemplateColumns: `repeat(${imagesAcross}, 1fr)` };

  return (
    <div
      className={`skeleton-image-grid ${isMasonry ? 'masonry' : 'grid'}`}
      style={style}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="skeleton-card">
          <SkeletonImage aspectRatio={1.5} />
        </div>
      ))}
    </div>
  );
}

