import useFetchLessons from '../../hooks/useFetchLessons';
import './LessonList.css';

/**
 * Lesson List Component - Course Explorer
 * Displays all lessons from the backend API
 * Allows selecting a lesson which updates parent Layout state
 */
export default function LessonList({ currentLessonId, onSelectLesson }) {
  const { lessons, loading, error } = useFetchLessons();

  // Loading state
  if (loading) {
    return (
      <div className="lesson-list lesson-list--loading">
        <div className="lesson-list__spinner">⏳</div>
        <p>Loading lessons...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="lesson-list lesson-list--error">
        <div className="lesson-list__error-icon">❌</div>
        <p>{error}</p>
      </div>
    );
  }

  // Empty state
  if (!lessons || lessons.length === 0) {
    return (
      <div className="lesson-list lesson-list--empty">
        <div className="lesson-list__empty-icon">📭</div>
        <p>No lessons available</p>
      </div>
    );
  }

  // Render lessons list
  return (
    <div className="lesson-list">
      <h3 className="lesson-list__title">Course Explorer</h3>
      <ul className="lesson-list__items">
        {lessons.map((lesson) => (
          <li
            key={lesson.id}
            className={`lesson-item ${
              currentLessonId === lesson.id ? 'lesson-item--active' : ''
            }`}
            onClick={() => onSelectLesson(lesson.id)}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onSelectLesson(lesson.id);
              }
            }}
          >
            <span className="lesson-item__icon">🎥</span>
            <span className="lesson-item__title">{lesson.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}