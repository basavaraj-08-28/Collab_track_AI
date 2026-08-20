import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState('public');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Restore authenticated session on initial mount
  useEffect(() => {
    const token = localStorage.getItem('collab_track_auth_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            setRole(res.user.role || 'student');
            setCurrentPage(res.user.role === 'instructor' ? 'instructor-dashboard' : 'student-dashboard');
          } else {
            localStorage.removeItem('collab_track_auth_token');
            setUser(null);
            setRole('public');
            setCurrentPage('landing');
          }
        })
        .catch(() => {
          localStorage.removeItem('collab_track_auth_token');
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
      setUser(res.user);
      setRole(res.user.role);
      setCurrentPage(res.user.role === 'instructor' ? 'instructor-dashboard' : 'student-dashboard');
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
      setUser(res.user);
      setRole(res.user.role);
      setCurrentPage(res.user.role === 'instructor' ? 'instructor-dashboard' : 'student-dashboard');
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
    if (params.projectId) {
      setSelectedProjectId(params.projectId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const logout = () => {
    localStorage.removeItem('collab_track_auth_token');
    api.post('/auth/logout', {}).catch(() => {});
    setRole('public');
    setUser(null);
    setCurrentPage('landing');
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        setUser,
        loading,
        updateUserProfile,
        currentPage,
        selectedProjectId,
        unreadNotificationsCount,
        navigateTo,
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
