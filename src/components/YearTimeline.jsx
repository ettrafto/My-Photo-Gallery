import './YearTimeline.css';

/**
 * YearTimeline - Mini timeline for quick year selection
 * @param {Object} props
 * @param {string|null} props.selectedYear - Currently selected year
 * @param {Array<string>} props.availableYears - List of available years
 * @param {Function} props.onYearChange - Callback when year changes (year) => void
 */
export default function YearTimeline({ selectedYear, availableYears = [], onYearChange }) {
  if (availableYears.length === 0) return null;

  return (
    <div className="year-timeline">
      <div className="timeline-line">
        {availableYears.map((year, index) => (
          <button
            key={year}
            className={`timeline-tick ${selectedYear === year ? 'active' : ''}`}
            onClick={() => onYearChange(year)}
            title={year}
            style={{
              left: `${(index / (availableYears.length - 1)) * 100}%`
            }}
          >
            <span className="tick-mark"></span>
            <span className="tick-label">{year}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

