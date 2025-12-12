import './Skeleton.css';

export default function SkeletonBlock({
  width = '100%',
  height = '1rem',
  rounded = 6,
  className = '',
  variant = 'medium',
}) {
  const classes = ['skeleton-base', 'skeleton-block', `skeleton-variant-${variant}`, className]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={classes}
      style={{ width, height, borderRadius: rounded }}
      aria-hidden="true"
    />
  );
}

