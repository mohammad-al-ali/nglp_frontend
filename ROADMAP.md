# NGLP Frontend Development Roadmap

## Phase 1: Core IDE Layout Architecture
**Goal**: Build the foundational flex-based layout matching VS Code's design language

### Components to Build
- ✅ Activity Bar (Far Left) - Static navigation icons container
- ✅ Primary Sidebar (Left) - Course Explorer placeholder
- ✅ Main Editor Area (Center) - Content container
- ✅ Secondary Sidebar (Right) - Chat container placeholder
- ✅ Status Bar (Bottom) - Toggle controls

### Tasks
1. Refactor Layout.jsx with proper flexbox structure
2. Create Layout.css with full viewport flex layout
3. Create StatusBar component for toggle controls
4. Implement toggle state management (showPrimarySidebar, showDetailsPanel, showSecondarySidebar)
5. Create ActivityBar component with icon styling
6. Style all containers with light theme colors

### Deliverables
- Fully responsive IDE layout
- Toggle buttons functional (state-driven)
- Mobile-responsive design

---

## Phase 2: Lesson List Integration & API Connection
**Goal**: Connect the Course Explorer sidebar to the backend lessons API

### Components to Build/Refactor
- ✅ LessonList.jsx - Connected to GET /api/lessons
- ✅ LessonItem component - Individual lesson display

### Tasks
1. Create Axios API client (src/services/api.js)
2. Create custom hook `useFetchLessons()` in src/hooks/useFetchLessons.js
3. Connect LessonList.jsx to fetch and display lessons from API
4. Implement onClick handler to set `currentLessonId` in parent Layout
5. Add loading & error states with UI feedback
6. Style the lesson list with proper scrolling and hover effects

### Deliverables
- Lessons dynamically loaded from backend
- Lesson items clickable and selectable
- Error handling & loading spinners

---

## Phase 3: Video Player & Details Panel
**Goal**: Create video player and toggleable lesson details panel

### Components to Build
- ✅ VideoPlayer component - Displays lesson video
- ✅ DetailsPanel component - Shows title, description, metadata
- ✅ Toggle mechanism in Status Bar for Details Panel

### Tasks
1. Fetch lesson details via GET /api/lessons/:id on currentLessonId change
2. Extract video URL from lesson details API
3. Create VideoPlayer component (using native HTML5 <video>)
4. Create DetailsPanel component with title, description, metadata display
5. Implement toggle state for Details Panel visibility
6. Style Details Panel with proper spacing and typography

### Deliverables
- Video plays from lesson API
- Details Panel shows/hides based on toggle
- Responsive layout adjustments

---

## Phase 4: AI Tutor Chat Interface
**Goal**: Build real-time Q&A interface in right sidebar

### Components to Build
- ✅ ChatInterface component - Message display & input
- ✅ MessageList component - Scrollable message history
- ✅ ChatInput component - User input area

### Tasks
1. Create ChatInterface component with message display
2. Implement POST /api/ai/ask integration with Axios
3. Create useFetchAIResponse() hook
4. Display AI responses in chat
5. Implement message history (local state)
6. Add loading states while waiting for AI response
7. Style chat interface with light theme AI response highlighting

### Deliverables
- Send messages to AI Tutor
- Display responses in real-time
- Clean chat UI with scrolling

---

## Phase 5: Refinement & Edge Cases
**Goal**: Polish and handle edge cases

### Tasks
1. Add keyboard shortcuts (e.g., Ctrl+B for toggle sidebar)
2. Implement localStorage for UI state persistence (sidebar visibility)
3. Add animations for panel transitions
4. Improve error handling with toast notifications
5. Optimize component re-renders with React.memo()
6. Add loading skeletons
7. Test all responsive breakpoints

### Deliverables
- Polished user experience
- Persistent UI state
- Smooth animations

---

## Phase 6: Testing & Documentation
**Goal**: Comprehensive testing and code documentation

### Tasks
1. Write unit tests for API clients
2. Write component tests for Layout, LessonList, ChatInterface
3. E2E tests with Cypress
4. JSDoc comments on all components
5. README with setup instructions
6. API documentation

### Deliverables
- >80% code coverage
- Full documentation
- Deployment-ready code

---

## Future Phases (Post-MVP)
- Phase 7: Authentication & User Profiles
- Phase 8: Progress Tracking & Analytics
- Phase 9: Advanced AI Features (Markdown, Code Highlighting in Chat)
- Phase 10: Dark Mode Support
