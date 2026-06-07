/**
 * Activity Bar Component
 * Vertical navigation strip on far left (VS Code style)
 * Contains static navigation icons: Home and Profile
 */

import './ActivityBar.css';

export default function ActivityBar() {
  return (
    <div className="activity-bar">
      <button
        className="activity-bar__icon activity-bar__icon--home"
        title="Home"
        aria-label="Home"
      >
        🏠
      </button>
      <button
        className="activity-bar__icon activity-bar__icon--profile"
        title="Profile"
        aria-label="Profile"
      >
        👤
      </button>
    </div>
  );
}
