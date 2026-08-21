import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyProjectsPage from './pages/student/MyProjectsPage';
import ProjectDetailsPage from './pages/student/ProjectDetailsPage';
import MyTasksPage from './pages/student/MyTasksPage';
import CollaborationActivityPage from './pages/student/CollaborationActivityPage';
import MessagesDiscussionPage from './pages/student/MessagesDiscussionPage';
import MyCollaborationScorePage from './pages/student/MyCollaborationScorePage';
import PerformanceAnalyticsPage from './pages/student/PerformanceAnalyticsPage';
import AIInsightsPage from './pages/student/AIInsightsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentNotificationsPage from './pages/student/StudentNotificationsPage';

// Instructor Pages
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CreateProjectPage from './pages/instructor/CreateProjectPage';
import ManageProjectsPage from './pages/instructor/ManageProjectsPage';
import InstructorProjectDetailsPage from './pages/instructor/InstructorProjectDetailsPage';
import StudentContributionsPage from './pages/instructor/StudentContributionsPage';
import CollaborationAnalyticsPage from './pages/instructor/CollaborationAnalyticsPage';
import StudentPerformancePage from './pages/instructor/StudentPerformancePage';
import GroupComparisonPage from './pages/instructor/GroupComparisonPage';
import ReportsPage from './pages/instructor/ReportsPage';
import InstructorProfilePage from './pages/instructor/InstructorProfilePage';
import InstructorNotificationsPage from './pages/instructor/InstructorNotificationsPage';

import StudentAIChatbot from './components/AI/StudentAIChatbot';

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
      case 'project-details':
        return <ProjectDetailsPage />;
      case 'my-tasks':
        return <MyTasksPage />;
      case 'collaboration-activity':
        return <CollaborationActivityPage />;
      case 'messages':
        return <MessagesDiscussionPage />;
      case 'my-score':
        return <MyCollaborationScorePage />;
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
    return <div className="min-h-screen bg-slate-50">{renderPage()}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] pb-12 overflow-x-hidden">
          {renderPage()}
        </main>
      </div>

      {/* Student AI Assistant Floating Chatbot */}
      {role === 'student' && <StudentAIChatbot />}
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
