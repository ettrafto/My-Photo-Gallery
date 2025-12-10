import './DateFilterPresets.css';

/**
 * DateFilterPresets - Modern preset chips for date filtering
 * @param {Object} props
 * @param {string|null} props.activePreset - Currently active preset ('all' | 'last12months' | 'thisyear')
 * @param {Function} props.onPresetChange - Callback when preset changes (preset) => void
 */
export default function DateFilterPresets({ activePreset, onPresetChange }) {
  const presets = [
    { id: 'all', label: 'All time' },
    { id: 'last12months', label: 'Last 12 months' },
    { id: 'thisyear', label: 'This year' }
  ];

  return (
    <div className="date-preset-chips">
      {presets.map(preset => (
        <button
          key={preset.id}
          className={`preset-chip ${activePreset === preset.id ? 'active' : ''}`}
          onClick={() => onPresetChange(preset.id)}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

