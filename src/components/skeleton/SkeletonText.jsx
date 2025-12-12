import SkeletonBlock from './SkeletonBlock';
import './Skeleton.css';

export default function SkeletonText({
  lines = 3,
  lineHeight = '0.9rem',
  gap = '0.5rem',
  className = '',
  variant = 'medium',
}) {
  const widths = [100, 92, 86, 78, 64];
  const classes = ['skeleton-text', className].filter(Boolean).join(' ');
  return (
    <div className={classes} style={{ gap }}>
      {Array.from({ length: lines }).map((_, idx) => (
        <SkeletonBlock
          key={idx}
          height={lineHeight}
          width={`${widths[idx % widths.length]}%`}
          variant={variant}
        />
      ))}
    </div>
  );
}

