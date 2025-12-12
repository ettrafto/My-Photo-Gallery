import './Skeleton.css';

export default function SkeletonBar({
  width = '100%',
  height = '0.75rem',
  className = '',
  variant = 'medium',
}) {
  const classes = ['skeleton-base', 'skeleton-bar', className, `skeleton-variant-${variant}`]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={classes}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

