import SkeletonBar from './SkeletonBar';
import SkeletonText from './SkeletonText';
import './Skeleton.css';

export default function SkeletonExifBar() {
  return (
    <div className="skeleton-exif-bar" aria-hidden="true">
      <SkeletonBar width="60%" height="0.75rem" variant="light" />
      <SkeletonText lines={2} lineHeight="0.65rem" gap="0.35rem" />
    </div>
  );
}

