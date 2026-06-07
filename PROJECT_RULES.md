# NGLP Frontend - Project Rules & Standards

## Tech Stack
- **Framework**: React 18+ (Vite)
- **Styling**: CSS3 (Flexbox/Grid) - NO Tailwind, NO CSS-in-JS
- **HTTP Client**: Axios (NEVER use Fetch)
- **State Management**: React useState/useEffect + prop lifting (no Redux/Context initially)
- **Build Tool**: Vite
- **Package Manager**: npm

## Color Palette (Light Theme)
- **Primary Background**: #FFFFFF
- **Secondary Background**: #F5F5F5
- **Tertiary Background**: #EFEFEF
- **Text Primary**: #1E1E1E
- **Text Secondary**: #666666
- **Border**: #D0D0D0
- **Accent (Blue)**: #0078D4
- **Accent (Hover)**: #106EBE
- **AI Chat BG**: #F0F7FF
- **Status Bar BG**: #EFEFEF

## Folder Structure (Feature-Based)
```
src/
├── features/
│   ├── layout/           # Main layout container
│   ├── lessons/          # Lesson list & lesson details
│   ├── ai-chat/          # AI tutor chat interface
│   └── video-player/     # Video playback component
├── components/
│   └── ui/               # Reusable UI components (buttons, panels, etc.)
├── services/             # Axios API clients
├── hooks/                # Custom React hooks
├── utils/                # Helper functions
├── App.jsx               # Root component
└── main.jsx              # Entry point
```

## State Management Rules
1. **State Lifting**: Keep `currentLessonId` at Layout component level
2. **Props Drilling**: Pass state down via props (acceptable for this MVP)
3. **API Calls**: Use custom hooks (e.g., `useFetchLessons()`) in features
4. **No Global State**: Avoid Redux/Context for Phase 1-2
5. **Axios Instances**: Create a single axios instance in `src/services/api.js`

## CSS Architecture Rules
1. **Naming**: BEM convention (block__element--modifier)
2. **No Scoped CSS**: Use standard CSS files with descriptive class names
3. **Layout**: Flexbox/Grid only
4. **Responsive**: Mobile-first approach
5. **IDE Philosophy**: Dark strip on edges, light main content areas

## API Integration
- **Base URL**: `http://localhost:8080`
- **Default userId**: 1 (hardcoded for MVP)
- **CORS**: Assumed configured on backend
- **Timeout**: 5000ms

## Commit Strategy
- Feature branches from `main`
- Branch naming: `feature/component-name`
- Commit message format: `feat: description` or `fix: description`

## Performance Considerations
1. Lazy load components when possible
2. Memoize components receiving stable props
3. Use `useCallback` for event handlers passed to children
4. Avoid unnecessary re-renders with proper dependency arrays

## Testing (Phase 3+)
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Cypress (future phase)
