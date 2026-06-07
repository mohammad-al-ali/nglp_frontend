import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import RoleRoute, { ROLE_ADMIN, ROLE_STUDENT, ROLE_TEACHER } from './components/RoleRoute';
import Sidebar from './components/Sidebar';
import './App.css';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();

  return (
    <div 
      className="app-shell" 
      data-path={location.pathname}
      style={{
        display: 'flex',
        minHeight: '100vh',
        direction: 'rtl',
        backgroundColor: 'var(--bg)'
      }}
    >
      <Sidebar />
      <main 
        style={{ 
          flex: 1, 
          marginRight: '280px', // exact offset for sidebar width
          minHeight: '100vh',
          backgroundColor: 'var(--bg)',
          transition: 'margin-right var(--transition-normal)'
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default App;