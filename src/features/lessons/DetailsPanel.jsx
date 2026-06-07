/**
 * Details Panel Component
 * Shows lesson metadata: title, description, duration, difficulty, etc.
 * Located at the bottom of the editor area (toggleable)
 */

import './DetailsPanel.css';

export default function DetailsPanel({ lesson, isLoading, error }) {
  // Loading state
  if (isLoading) {
    return (
      <div className="details-panel details-panel--loading">
        <div className="details-panel__spinner">⏳</div>
        <p>Loading details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="details-panel details-panel--error">
        <div className="details-panel__error-icon">❌</div>
        <p>{error}</p>
      </div>
    );
  }

  // No lesson selected state
  if (!lesson) {
    return (
      <div className="details-panel details-panel--empty">
        <p>Select a lesson to see details</p>
      </div>
    );
  }

  // Details panel with lesson metadata
  return (
    <div className="details-panel">
      <div className="details-panel__content">
        <h3 className="details-panel__title">
          📝 {lesson.title}
        </h3>

        {lesson.description && (
          <div className="details-panel__section">
            <h4 className="details-panel__subtitle">Description</h4>
            <p className="details-panel__text">{lesson.description}</p>
          </div>
        )}

        {lesson.duration && (
          <div className="details-panel__section">
            <h4 className="details-panel__subtitle">Duration</h4>
            <p className="details-panel__text">⏱️ {lesson.duration}</p>
          </div>
        )}

        {lesson.difficulty && (
          <div className="details-panel__section">
            <h4 className="details-panel__subtitle">Difficulty</h4>
            <p className="details-panel__text">
              {lesson.difficulty === 'easy' && '🟢 Easy'}
              {lesson.difficulty === 'medium' && '🟡 Medium'}
              {lesson.difficulty === 'hard' && '🔴 Hard'}
            </p>
          </div>
        )}

        {lesson.tags && Array.isArray(lesson.tags) && lesson.tags.length > 0 && (
          <div className="details-panel__section">
            <h4 className="details-panel__subtitle">Tags</h4>
            <div className="details-panel__tags">
              {lesson.tags.map((tag, index) => (
                <span key={index} className="details-panel__tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {lesson.instructor && (
          <div className="details-panel__section">
            <h4 className="details-panel__subtitle">Instructor</h4>
            <p className="details-panel__text">👨‍🏫 {lesson.instructor}</p>
          </div>
        )}

        {lesson.dueDate && (
          <div className="details-panel__section">
            <h4 className="details-panel__subtitle">Due Date</h4>
            <p className="details-panel__text">📅 {lesson.dueDate}</p>
          </div>
        )}
      </div>
    </div>
  );
}
