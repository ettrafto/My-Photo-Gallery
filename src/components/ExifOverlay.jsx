import './ExifOverlay.css';

/**
 * ExifOverlay - Retro camera-style EXIF info overlay for album images
 * Displays on hover with slide-up animation
 * 
 * @param {Object} props
 * @param {Object} props.photo - Photo object with EXIF data
 * @param {number} props.currentIndex - Current photo index (1-based)
 * @param {number} props.totalImages - Total number of images in album
 */
export default function ExifOverlay({ photo, currentIndex, totalImages }) {
  // Extract EXIF data with fallbacks for missing fields
  const exif = photo.exif || {};
  const filename = photo.filename || 'Unknown';
  
  // Format EXIF data for display
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Build camera info line (camera + lens)
  const cameraLine = [exif.camera, exif.lens].filter(Boolean).join('  •  ');
  
  // Build settings line (focal length, aperture, shutter, ISO)
  const settingsLine = [
    exif.focalLength,
    exif.aperture,
    exif.shutterSpeed,
    exif.iso ? `ISO ${exif.iso}` : null
  ].filter(Boolean).join('  •  ');

  const formattedDate = formatDate(exif.dateTaken);

  return (
    <div className="exif-overlay">
      {/* Header: filename and position */}
      <div className="exif-header">
        <span className="exif-filename">{filename}</span>
        <span className="exif-position">{currentIndex} / {totalImages}</span>
      </div>

      {/* EXIF details */}
      <div className="exif-details">
        {formattedDate && (
          <div className="exif-line exif-date">{formattedDate}</div>
        )}
        {cameraLine && (
          <div className="exif-line exif-camera">{cameraLine}</div>
        )}
        {settingsLine && (
          <div className="exif-line exif-settings">{settingsLine}</div>
        )}
        {!formattedDate && !cameraLine && !settingsLine && (
          <div className="exif-line exif-fallback">No EXIF data available</div>
        )}
      </div>
    </div>
  );
}

