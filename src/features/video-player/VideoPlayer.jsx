/**
 * Video Player Component
 * Displays HTML5 video player with lesson video
 * Handles loading, error, and no-video states
 */

import './VideoPlayer.css';

export default function VideoPlayer({ videoUrl, isLoading, error, lessonTitle }) {
  // Loading state
  if (isLoading) {
    return (
      <div className="video-player video-player--loading">
        <div className="video-player__spinner">⏳</div>
        <p>Loading video...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="video-player video-player--error">
        <div className="video-player__error-icon">⚠️</div>
        <p>{error}</p>
      </div>
    );
  }

  // No video state
  if (!videoUrl) {
    return (
      <div className="video-player video-player--empty">
        <div className="video-player__placeholder-icon">🎬</div>
        <p>Select a lesson to play video</p>
      </div>
    );
  }

  // Video player
  return (
    <div className="video-player">
      <div className="video-player__container">
        <video
          className="video-player__video"
          controls
          controlsList="nodownload"
          title={lessonTitle || 'Lesson Video'}
        >
          <source src={videoUrl} type="video/mp4" />
          <p>Your browser does not support HTML5 video. Please update your browser.</p>
        </video>
      </div>
      {lessonTitle && (
        <div className="video-player__title">
          <span>▶️</span> {lessonTitle}
        </div>
      )}
    </div>
  );
}
