import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import RoleRoute, { ROLE_ADMIN, ROLE_STUDENT, ROLE_TEACHER } from './components/RoleRoute';
import Toaster from './components/ui/toaster';
import Sidebar from './components/Sidebar';
import MarketingHeader from './components/layout/MarketingHeader';
import MarketingFooter from './components/layout/MarketingFooter';

// Import extracted pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudyRoom from './pages/student/StudyRoom';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetails from './pages/CourseDetails';
import ProfilePage from './pages/ProfilePage';
import TeacherOverview from './pages/teacher/TeacherOverview';
import CourseBuilder from './pages/teacher/CourseBuilder';
import ManageCourse from './pages/teacher/ManageCourse';
import ManageLessons from './pages/teacher/ManageLessons';
import CategoriesManager from './pages/admin/CategoriesManager';
import UsersManagement from './pages/admin/UsersManagement';
import QuizManager from './pages/teacher/QuizManager';
import QuizEditor from './pages/teacher/QuizEditor';
import QuizTaker from './pages/student/QuizTaker';
import StudentQuizList from './pages/student/StudentQuizList';

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route element={<MarketingShell />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route element={<AppShell />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={[ROLE_STUDENT]}>
                <StudentDashboard />
              </RoleRoute>
            }
          />
          <Route path="/catalog" element={<CourseCatalog />} />
          <Route path="/catalog/:courseId" element={<CourseDetails />} />
          <Route
            path="/profile"
            element={
              <RoleRoute allowedRoles={[ROLE_ADMIN, ROLE_STUDENT, ROLE_TEACHER]}>
                <ProfilePage />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <TeacherOverview />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/course-builder"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <CourseBuilder />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/manage-course/:courseId"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <ManageCourse />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/manage-lessons"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <ManageLessons />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/manage-lessons/:courseId"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <ManageLessons />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/quiz-manager/:courseId/:lessonId"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <QuizManager />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/quizzes/:quizId"
            element={
              <RoleRoute allowedRoles={[ROLE_TEACHER]}>
                <QuizEditor />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/categories"
            element={
              <RoleRoute allowedRoles={[ROLE_ADMIN]}>
                <CategoriesManager />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={[ROLE_ADMIN]}>
                <UsersManagement />
              </RoleRoute>
            }
          />
        </Route>
        <Route element={<FullBleedShell />}>
          <Route
            path="/study/:courseId/lesson/:lessonId"
            element={
              <RoleRoute allowedRoles={[ROLE_STUDENT]}>
                <StudyRoom />
              </RoleRoute>
            }
          />
          <Route
            path="/study-room/:courseId/lesson/:lessonId"
            element={
              <RoleRoute allowedRoles={[ROLE_STUDENT]}>
                <StudyRoom />
              </RoleRoute>
            }
          />
          <Route
            path="/study/:courseId/lesson/:lessonId/quizzes"
            element={
              <RoleRoute allowedRoles={[ROLE_STUDENT]}>
                <StudentQuizList />
              </RoleRoute>
            }
          />
          <Route
            path="/study/:courseId/lesson/:lessonId/quiz/:quizId"
            element={
              <RoleRoute allowedRoles={[ROLE_STUDENT]}>
                <QuizTaker />
              </RoleRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();

  return (
    <div
      data-path={location.pathname}
      style={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      <Sidebar />
      <main
        style={{
          flex: 1,
          // Flex items default to min-width:auto, which refuses to shrink
          // below the content's natural (non-wrapping) width. Any page with
          // a wide row inside (e.g. CourseCatalog's category-chip strip)
          // then pushes this whole column past the viewport instead of
          // being contained by it, throwing off PageShell's centering and
          // clipping content at the far edge. min-width:0 is the standard
          // fix for a flex item meant to hold scrollable/wrapping content.
          minWidth: 0,
          marginInlineStart: 'var(--sidebar-width)',
          minHeight: '100vh',
          transition: 'margin-inline-start var(--transition-normal)'
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

/**
 * Public marketing layout: top header + footer, no sidebar. The landing page
 * is a full-bleed marketing page, so the sidebar's 280px offset would fight
 * its hero and full-width bands.
 */
function MarketingShell() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
      <MarketingHeader />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}

/**
 * Layout for routes that need the full viewport with no sidebar
 * (StudyRoom, quizzes) — still inherits RTL from <html dir="rtl">.
 */
function FullBleedShell() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Outlet />
    </div>
  );
}

export default App;




