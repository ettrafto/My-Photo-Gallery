import './LayoutControls.css';

/**
 * LayoutControls - Control bar for album image layout
 * @param {Object} props
 * @param {1|3|5} props.imagesAcross - Number of columns
 * @param {'grid'|'masonry'} props.layoutMode - Layout type
 * @param {Function} props.onImagesAcrossChange - Callback when columns change
 * @param {Function} props.onLayoutModeChange - Callback when layout type changes
 */
export default function LayoutControls({ 
  imagesAcross, 
  layoutMode, 
  onImagesAcrossChange, 
  onLayoutModeChange 
}) {
  const columnOptions = [1, 3, 5];
  const layoutOptions = [
    { value: 'grid', label: 'Grid' },
    { value: 'masonry', label: 'Masonry' }
  ];

  return (
    <div className="layout-controls">
      {/* Images Across Selector */}
      <div className="control-group">
        <span className="control-label">Images Across:</span>
        <div className="segmented-control">
          {columnOptions.map(option => (
            <button
              key={option}
              className={`segment-btn ${imagesAcross === option ? 'active' : ''}`}
              onClick={() => onImagesAcrossChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Type Selector */}
      <div className="control-group">
        <span className="control-label">Layout:</span>
        <div className="segmented-control">
          {layoutOptions.map(option => (
            <button
              key={option.value}
              className={`segment-btn ${layoutMode === option.value ? 'active' : ''}`}
              onClick={() => onLayoutModeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

