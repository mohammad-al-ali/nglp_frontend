import { useState, useEffect } from 'react';
import './Layout.css';
import ActivityBar from './ActivityBar';
import StatusBar from './StatusBar';
import LessonList from '../lessons/LessonList';
import VideoPlayer from '../video-player/VideoPlayer';
import DetailsPanel from '../lessons/DetailsPanel';
import ChatInterface from '../ai-chat/ChatInterface';
import useFetchLessonDetails from '../../hooks/useFetchLessonDetails';
import { loadFromStorage, saveToStorage } from '../../utils/storage';
import { setupKeyboardShortcuts } from '../../utils/keyboard';

/**
 * Main Layout Component - IDE-like Learning Platform
 * Features:
 * - State lifting: currentLessonId managed at Layout level
 * - localStorage: Persists sidebar and panel visibility across sessions
 * - Keyboard shortcuts: Ctrl+B, Ctrl+Shift+D, Ctrl+Shift+R
 * - Children: ActivityBar, StatusBar, LessonList, VideoPlayer, DetailsPanel, ChatInterface
 */
export default function Layout() {
  // Toggle states with localStorage persistence
  const [showPrimarySidebar, setShowPrimarySidebar] = useState(() =>
    loadFromStorage('showPrimarySidebar', true)
  );
  const [showDetailsPanel, setShowDetailsPanel] = useState(() =>
    loadFromStorage('showDetailsPanel', true)
  );
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(() =>
    loadFromStorage('showSecondarySidebar', true)
  );

  // Currently selected lesson
  const [currentLessonId, setCurrentLessonId] = useState(null);

  // Fetch lesson details when currentLessonId changes
  const { lesson, loading: detailsLoading, error: detailsError } = useFetchLessonDetails(currentLessonId);

  // Persist sidebar states to localStorage
  useEffect(() => {
    saveToStorage('showPrimarySidebar', showPrimarySidebar);
  }, [showPrimarySidebar]);

  useEffect(() => {
    saveToStorage('showDetailsPanel', showDetailsPanel);
  }, [showDetailsPanel]);

  useEffect(() => {
    saveToStorage('showSecondarySidebar', showSecondarySidebar);
  }, [showSecondarySidebar]);

  // Setup keyboard shortcuts
  useEffect(() => {
    const cleanup = setupKeyboardShortcuts({
      togglePrimarySidebar: () => setShowPrimarySidebar((prev) => !prev),
      toggleDetailsPanel: () => setShowDetailsPanel((prev) => !prev),
      toggleSecondarySidebar: () => setShowSecondarySidebar((prev) => !prev),
    });

    return cleanup;
  }, []);

  return (
    <div className="ide-container">
      <div className="ide-main-area">
        {/* Left Activity Bar - Static Navigation */}
        <ActivityBar />

        {/* Left Primary Sidebar - Course Explorer (Toggleable) */}
        {showPrimarySidebar && (
          <aside className="primary-sidebar">
            <LessonList
              currentLessonId={currentLessonId}
              onSelectLesson={setCurrentLessonId}
            />
          </aside>
        )}

        {/* Center Main Editor Area */}
        <main className="editor-area">
          {/* Top: Video Player Section */}
          <div className="video-player-section">
            <VideoPlayer
              videoUrl={lesson?.videoUrl}
              isLoading={detailsLoading}
              error={detailsError}
              lessonTitle={lesson?.title}
            />
          </div>

          {/* Bottom: Details Panel (Toggleable) */}
          {showDetailsPanel && (
            <div className="bottom-panel">
              <DetailsPanel
                lesson={lesson}
                isLoading={detailsLoading}
                error={detailsError}
              />
            </div>
          )}
        </main>

        {/* Right Secondary Sidebar - AI Tutor Chat (Toggleable) */}
        {showSecondarySidebar && (
          <aside className="secondary-sidebar">
            <ChatInterface currentLessonId={currentLessonId} />
          </aside>
        )}
      </div>

      {/* Bottom Status Bar - Controls and Info */}
      <StatusBar
        showPrimarySidebar={showPrimarySidebar}
        onTogglePrimarySidebar={() => setShowPrimarySidebar(!showPrimarySidebar)}
        showDetailsPanel={showDetailsPanel}
        onToggleDetailsPanel={() => setShowDetailsPanel(!showDetailsPanel)}
        showSecondarySidebar={showSecondarySidebar}
        onToggleSecondarySidebar={() => setShowSecondarySidebar(!showSecondarySidebar)}
      />
    </div>
  );
}