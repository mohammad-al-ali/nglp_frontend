/**
 * Status Bar Component
 * Bottom bar with toggle buttons to show/hide sidebars and details panel
 * VS Code-style information display area
 */

import './StatusBar.css';

export default function StatusBar({
  showPrimarySidebar,
  onTogglePrimarySidebar,
  showDetailsPanel,
  onToggleDetailsPanel,
  showSecondarySidebar,
  onToggleSecondarySidebar,
}) {
  return (
    <footer className="status-bar">
      <div className="status-bar__left">
        <span className="status-bar__text">NGLP Learning IDE</span>
      </div>

      <div className="status-bar__center">
        <span className="status-bar__info">Ready</span>
      </div>

      <div className="status-bar__right">
        <button
          className="status-bar__toggle"
          onClick={onTogglePrimarySidebar}
          title={showPrimarySidebar ? 'Hide Course Explorer' : 'Show Course Explorer'}
          aria-label="Toggle Course Explorer Sidebar"
        >
          {showPrimarySidebar ? '📚 Explorer' : '📚'}
        </button>

        <button
          className="status-bar__toggle"
          onClick={onToggleDetailsPanel}
          title={showDetailsPanel ? 'Hide Details Panel' : 'Show Details Panel'}
          aria-label="Toggle Details Panel"
        >
          {showDetailsPanel ? '📝 Details' : '📝'}
        </button>

        <button
          className="status-bar__toggle"
          onClick={onToggleSecondarySidebar}
          title={showSecondarySidebar ? 'Hide AI Tutor' : 'Show AI Tutor'}
          aria-label="Toggle AI Tutor Sidebar"
        >
          {showSecondarySidebar ? '🤖 Tutor' : '🤖'}
        </button>
      </div>
    </footer>
  );
}
