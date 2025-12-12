import './Skeleton.css';

export default function SkeletonImage({
  aspectRatio = 1.5,
  className = '',
  variant = 'medium',
  rounded = 8,
}) {
  const padding = `${(1 / aspectRatio) * 100}%`;
  const outer = ['skeleton-image', className].filter(Boolean).join(' ');
  const inner = ['skeleton-base', 'skeleton-image-inner', `skeleton-variant-${variant}`]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={outer}>
      <div
        className={inner}
        style={{ paddingBottom: padding, borderRadius: rounded }}
        aria-hidden="true"
      />
    </div>
  );
}

