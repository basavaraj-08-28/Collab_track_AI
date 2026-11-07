import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Public Pages: Eager load LandingPage for instant initial paint
import LandingPage from './pages/public/LandingPage';
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));

// Student Pages (Lazy Loaded on demand)
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MyProjectsPage = lazy(() => import('./pages/student/MyProjectsPage'));
const ProjectDetailsPage = lazy(() => import('./pages/student/ProjectDetailsPage'));
const MyTasksPage = lazy(() => import('./pages/student/MyTasksPage'));
const MessagesDiscussionPage = lazy(() => import('./pages/student/MessagesDiscussionPage'));
const PerformanceAnalyticsPage = lazy(() => import('./pages/student/PerformanceAnalyticsPage'));
const StudentProfilePage = lazy(() => import('./pages/student/StudentProfilePage'));
const StudentIDEPage = lazy(() => import('./pages/student/StudentIDEPage'));

// Instructor Pages (Lazy Loaded on demand)
const InstructorDashboard = lazy(() => import('./pages/instructor/InstructorDashboard'));
const CreateProjectPage = lazy(() => import('./pages/instructor/CreateProjectPage'));
const ManageProjectsPage = lazy(() => import('./pages/instructor/ManageProjectsPage'));
const InstructorProjectDetailsPage = lazy(() => import('./pages/instructor/InstructorProjectDetailsPage'));
const StudentContributionsPage = lazy(() => import('./pages/instructor/StudentContributionsPage'));
const CollaborationAnalyticsPage = lazy(() => import('./pages/instructor/CollaborationAnalyticsPage'));
const StudentPerformancePage = lazy(() => import('./pages/instructor/StudentPerformancePage'));
const GroupComparisonPage = lazy(() => import('./pages/instructor/GroupComparisonPage'));
const ReportsPage = lazy(() => import('./pages/instructor/ReportsPage'));
const InstructorProfilePage = lazy(() => import('./pages/instructor/InstructorProfilePage'));
const InstructorNotificationsPage = lazy(() => import('./pages/instructor/InstructorNotificationsPage'));

const StudentAIChatbot = lazy(() => import('./components/AI/StudentAIChatbot'));

const PageFallback = () => (
  <div className="min-h-[40vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-400">Loading view...</span>
  </div>
);

const AppContent = () => {
  const { role, currentPage } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      // Public Views
      case 'landing':
        return <LandingPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'forgot-password':
        return <ForgotPasswordPage />;

      // Student Views
      case 'student-dashboard':
        return <StudentDashboard />;
      case 'my-projects':
        return <MyProjectsPage />;
      case 'student-ide':
        return <StudentIDEPage />;
      case 'project-details':
        return <ProjectDetailsPage />;
      case 'my-tasks':
        return <MyTasksPage />;
      case 'messages':
        return <MessagesDiscussionPage />;
      case 'student-analytics':
        return <PerformanceAnalyticsPage />;
      case 'student-profile':
        return <StudentProfilePage />;

      // Instructor Views
      case 'instructor-dashboard':
        return <InstructorDashboard />;
      case 'create-project':
        return <CreateProjectPage />;
      case 'manage-projects':
        return <ManageProjectsPage />;
      case 'instructor-project-details':
        return <InstructorProjectDetailsPage />;
      case 'student-contributions':
        return <StudentContributionsPage />;
      case 'collaboration-analytics':
        return <CollaborationAnalyticsPage />;
      case 'student-performance':
        return <StudentPerformancePage />;
      case 'group-comparison':
        return <GroupComparisonPage />;
      case 'reports':
        return <ReportsPage />;
      case 'instructor-profile':
        return <InstructorProfilePage />;
      case 'instructor-notifications':
        return <InstructorNotificationsPage />;

      default:
        return <LandingPage />;
    }
  };

  const isPublicView = ['landing', 'login', 'register', 'forgot-password'].includes(currentPage);

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Suspense fallback={<PageFallback />}>
          {renderPage()}
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] pb-12 overflow-x-hidden">
          <Suspense fallback={<PageFallback />}>
            {renderPage()}
          </Suspense>
        </main>
      </div>

      {/* Student AI Assistant Floating Chatbot */}
      {role === 'student' && (
        <Suspense fallback={null}>
          <StudentAIChatbot />
        </Suspense>
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
