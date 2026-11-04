import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState('public');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('collab_track_current_page') || 'landing';
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    const saved = localStorage.getItem('collab_track_selected_project_id');
    return saved !== null && saved !== undefined ? saved : null;
  });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Restore authenticated session on initial mount
  useEffect(() => {
    const token = localStorage.getItem('collab_track_auth_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            const userRole = res.user.role || 'student';
            setRole(userRole);
            localStorage.setItem('collab_track_active_role', userRole);

            const savedPage = localStorage.getItem('collab_track_current_page');
            const defaultPage = userRole === 'instructor' ? 'instructor-dashboard' : 'student-dashboard';
            const isInstructorValid = userRole === 'instructor' && savedPage && (
              savedPage.startsWith('instructor') ||
              ['create-project', 'manage-projects', 'student-contributions', 'student-performance', 'group-comparison', 'collaboration-analytics', 'reports'].includes(savedPage)
            );
            const isStudentValid = userRole === 'student' && savedPage && (
              savedPage.startsWith('student') ||
              ['my-projects', 'project-details', 'my-tasks', 'messages'].includes(savedPage)
            );

            const targetPage = isInstructorValid || isStudentValid ? savedPage : defaultPage;
            setCurrentPage(targetPage);
            localStorage.setItem('collab_track_current_page', targetPage);
          } else {
            localStorage.removeItem('collab_track_auth_token');
            localStorage.removeItem('collab_track_active_role');
            localStorage.removeItem('collab_track_current_page');
            localStorage.removeItem('collab_track_selected_project_id');
            setUser(null);
            setRole('public');
            setCurrentPage('landing');
          }
        })
        .catch(() => {
          localStorage.removeItem('collab_track_auth_token');
          localStorage.removeItem('collab_track_active_role');
          localStorage.removeItem('collab_track_current_page');
          localStorage.removeItem('collab_track_selected_project_id');
          setUser(null);
          setRole('public');
          setCurrentPage('landing');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.token) {
        localStorage.setItem('collab_track_auth_token', res.token);
      }
      if (res.user && res.user.role) {
        localStorage.setItem('collab_track_active_role', res.user.role);
      }
      setUser(res.user);
      setRole(res.user.role);
      const targetPage = res.user.role === 'instructor' ? 'instructor-dashboard' : 'student-dashboard';
      setCurrentPage(targetPage);
      localStorage.setItem('collab_track_current_page', targetPage);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const register = async (registerData) => {
    try {
      const res = await api.post('/auth/register', registerData);
      if (res.token) {
        localStorage.setItem('collab_track_auth_token', res.token);
      }
      if (res.user && res.user.role) {
        localStorage.setItem('collab_track_active_role', res.user.role);
      }
      setUser(res.user);
      setRole(res.user.role);
      const targetPage = res.user.role === 'instructor' ? 'instructor-dashboard' : 'student-dashboard';
      setCurrentPage(targetPage);
      localStorage.setItem('collab_track_current_page', targetPage);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const updateUserProfile = async (newProfileData) => {
    setUser((prev) => ({ ...prev, ...newProfileData }));
    try {
      const res = await api.put('/auth/profile', newProfileData);
      if (res.user) setUser(res.user);
    } catch (err) {
      console.warn('Could not update backend profile:', err.message);
    }
  };

  const navigateTo = (page, params = {}) => {
    if (params.projectId !== undefined && params.projectId !== null) {
      setSelectedProjectId(params.projectId);
      localStorage.setItem('collab_track_selected_project_id', String(params.projectId));
    }
    setCurrentPage(page);
    localStorage.setItem('collab_track_current_page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchRole = async (newRole) => {
    setRole(newRole);
    localStorage.setItem('collab_track_active_role', newRole);
    const targetPage = newRole === 'instructor' ? 'instructor-dashboard' : (newRole === 'student' ? 'student-dashboard' : 'landing');
    setCurrentPage(targetPage);
    localStorage.setItem('collab_track_current_page', targetPage);

    try {
      const res = await api.post('/auth/switch-role', { role: newRole });
      if (res && res.token) {
        localStorage.setItem('collab_track_auth_token', res.token);
      }
      if (res && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      // Gracefully handle if offline or backend unavailable
    }
  };

  const logout = () => {
    localStorage.removeItem('collab_track_auth_token');
    localStorage.removeItem('collab_track_active_role');
    localStorage.removeItem('collab_track_current_page');
    localStorage.removeItem('collab_track_selected_project_id');
    api.post('/auth/logout', {}).catch(() => {});
    setRole('public');
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        user,
        setUser,
        loading,
        updateUserProfile,
        currentPage,
        selectedProjectId,
        unreadNotificationsCount,
        navigateTo,
        switchRole,
        login,
        register,
        logout,
        setUnreadNotificationsCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
