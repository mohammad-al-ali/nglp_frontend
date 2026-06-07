# NGLP Frontend - Setup & Development Guide

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Spring Boot backend running on `http://localhost:8080`
- Git

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd frontend.v1

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Project Architecture

### Folder Structure
```
src/
├── features/                    # Feature-based modules
│   ├── layout/                 # Main IDE layout
│   │   ├── Layout.jsx          # Root layout component
│   │   ├── Layout.css
│   │   ├── ActivityBar.jsx     # Left navigation bar
│   │   ├── ActivityBar.css
│   │   ├── StatusBar.jsx       # Bottom control bar
│   │   └── StatusBar.css
│   ├── lessons/                # Lesson management
│   │   ├── LessonList.jsx      # Course explorer
│   │   ├── LessonList.css
│   │   ├── DetailsPanel.jsx    # Lesson details
│   │   └── DetailsPanel.css
│   ├── video-player/           # Video playback
│   │   ├── VideoPlayer.jsx     # HTML5 video player
│   │   └── VideoPlayer.css
│   └── ai-chat/                # AI tutor chat
│       ├── ChatInterface.jsx   # Main chat component
│       ├── ChatInterface.css
│       ├── MessageList.jsx     # Message history
│       ├── MessageList.css
│       ├── ChatInput.jsx       # Input field
│       └── ChatInput.css
├── components/                 # Reusable UI components
│   └── ui/
│       ├── Toast.jsx           # Notifications
│       ├── Toast.css
│       ├── Skeleton.jsx        # Loading placeholder
│       └── Skeleton.css
├── services/                   # API clients
│   └── api.js                  # Axios client
├── hooks/                      # Custom React hooks
│   ├── useFetchLessons.js      # Fetch all lessons
│   ├── useFetchLessonDetails.js # Fetch single lesson
│   └── useFetchAIResponse.js   # AI chat API
├── utils/                      # Helper functions
│   ├── storage.js              # localStorage helpers
│   └── keyboard.js             # Keyboard shortcuts
├── App.jsx                     # Root app component
└── main.jsx                    # Entry point
```

---

## Features

### 1. IDE-like Layout ✅
- **Activity Bar**: Left navigation with Home and Profile icons
- **Primary Sidebar**: Course Explorer with lesson list
- **Main Editor Area**: Video player + details panel
- **Secondary Sidebar**: AI Tutor chat interface
- **Status Bar**: Toggle controls for all sidebars

### 2. Lesson Management ✅
- Fetch and display lessons from backend API
- Click to select and play lesson video
- Display lesson metadata (title, description, duration, tags)
- Loading and error states handled gracefully

### 3. Video Player ✅
- HTML5 video player with native controls
- Auto-play selected lesson video
- Responsive video display

### 4. AI Tutor Chat ✅
- Send questions about current lesson
- Real-time AI responses
- Message history preserved in session
- Disabled until lesson is selected

### 5. Keyboard Shortcuts ✅
- `Ctrl+B`: Toggle Course Explorer sidebar
- `Ctrl+Shift+D`: Toggle Details Panel
- `Ctrl+Shift+R`: Toggle AI Tutor sidebar
- `Ctrl+Enter`: Send chat message

### 6. Persistent State ✅
- Sidebar visibility saved to localStorage
- Survives page refresh
- Automatic state restoration on load

### 7. Smooth Animations ✅
- Panel slide-in/out transitions
- Loading spinners and shimmer effects
- Hover effects on interactive elements

---

## Backend API Integration

### Required Endpoints

#### 1. GET /api/lessons
Returns list of all available lessons.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Introduction to React",
    "description": "Learn React basics...",
    "videoUrl": "https://...",
    "duration": "45 minutes",
    "difficulty": "easy",
    "tags": ["react", "javascript"],
    "instructor": "John Doe"
  }
]
```

#### 2. GET /api/lessons/:id
Returns specific lesson with video URL.

**Response:**
```json
{
  "id": 1,
  "title": "Introduction to React",
  "description": "Learn React basics...",
  "videoUrl": "https://example.com/video.mp4",
  "duration": "45 minutes",
  "difficulty": "easy",
  "dueDate": "2026-05-15",
  "tags": ["react", "javascript"],
  "instructor": "John Doe"
}
```

#### 3. POST /api/ai/ask
Send question to AI Tutor.

**Request:**
```json
{
  "userId": 1,
  "lessonId": 1,
  "message": "How do I use useState?"
}
```

**Response:**
```json
{
  "reply": "useState is a React Hook that lets you add state to functional components..."
}
```

---

## State Management

### State Hierarchy
```
Layout (Root)
├── showPrimarySidebar (localStorage)
├── showDetailsPanel (localStorage)
├── showSecondarySidebar (localStorage)
├── currentLessonId
├── lesson (from useFetchLessonDetails)
├── lessons (from useFetchLessons)
└── messages (in ChatInterface)
```

### Lifting State
- `currentLessonId` is managed in Layout component
- Passed down to child components via props
- Changes trigger data fetching in relevant children

---

## Component Props

### VideoPlayer
```jsx
<VideoPlayer
  videoUrl={string}      // URL to video file
  isLoading={boolean}    // True while fetching details
  error={string}         // Error message if any
  lessonTitle={string}   // Title displayed below video
/>
```

### DetailsPanel
```jsx
<DetailsPanel
  lesson={object}        // Lesson object with metadata
  isLoading={boolean}    // Loading state
  error={string}         // Error message
/>
```

### ChatInterface
```jsx
<ChatInterface
  currentLessonId={number} // Active lesson ID
/>
```

---

## Custom Hooks

### useFetchLessons()
Fetches list of all lessons on component mount.

```jsx
const { lessons, loading, error } = useFetchLessons();
```

### useFetchLessonDetails(lessonId)
Fetches specific lesson when ID changes.

```jsx
const { lesson, loading, error } = useFetchLessonDetails(currentLessonId);
```

### useFetchAIResponse()
Handles AI chat message sending.

```jsx
const { sendMessage, loading, error } = useFetchAIResponse();
const response = await sendMessage(lessonId, message);
```

---

## Utility Functions

### Storage (src/utils/storage.js)
```jsx
import { saveToStorage, loadFromStorage } from '@/utils/storage';

saveToStorage('key', value);      // Save to localStorage
const value = loadFromStorage('key', default);  // Load from localStorage
```

### Keyboard Shortcuts (src/utils/keyboard.js)
```jsx
import { setupKeyboardShortcuts } from '@/utils/keyboard';

useEffect(() => {
  const cleanup = setupKeyboardShortcuts({
    togglePrimarySidebar: () => {},
    toggleDetailsPanel: () => {},
    toggleSecondarySidebar: () => {},
  });
  return cleanup;
}, []);
```

---

## Available Scripts

### Development
```bash
npm run dev        # Start dev server (Vite)
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint (if configured)
```

### Testing (to be added)
```bash
npm run test       # Run unit tests (Vitest)
npm run test:e2e   # Run E2E tests (Cypress)
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Performance Tips

1. **Lazy Loading**: Lesson list loads on demand
2. **Custom Hooks**: Reusable logic, avoid prop drilling
3. **CSS**: Lightweight CSS3 instead of CSS-in-JS
4. **Memoization**: Components memoized where needed
5. **localStorage**: Reduces state recalculation

---

## Troubleshooting

### "Failed to fetch lessons"
- Ensure Spring Boot backend is running on `http://localhost:8080`
- Check CORS configuration on backend
- Verify `/api/lessons` endpoint exists

### Video not playing
- Ensure `videoUrl` is accessible from browser
- Check video format (MP4 recommended)
- Try different browsers to rule out compatibility

### AI Chat not responding
- Ensure `/api/ai/ask` endpoint is available
- Check request payload format
- Verify `userId=1` is accepted by backend

### localStorage not persisting
- Disable private/incognito browsing
- Check localStorage size limits
- Verify browser privacy settings

---

## Environment Variables

Create `.env` file in root:
```
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_USER_ID=1
```

Then use in code:
```jsx
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/component-name`
2. Make changes following project rules
3. Test on multiple screen sizes
4. Commit: `git commit -m "feat: description"`
5. Push: `git push origin feature/component-name`
6. Create Pull Request

---

## Tech Stack

- **React** 18+ (UI library)
- **Vite** (Build tool)
- **Axios** (HTTP client)
- **CSS3** (Styling - no Tailwind/CSS-in-JS)
- **localStorage** (Persistence)

---

## License

© 2026 NGLP - Next Generation Learning Platform

---

## Support

For issues or questions:
1. Check ROADMAP.md for development phases
2. Review PROJECT_RULES.md for standards
3. Check PROGRESS.md for completion status
