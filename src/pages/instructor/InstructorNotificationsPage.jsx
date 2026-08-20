import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Bell, Check, AlertTriangle, Brain, FolderKanban, GraduationCap } from 'lucide-react';

export const InstructorNotificationsPage = () => {
  const { setUnreadNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotificationsCount(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'grading':
        return <Brain className="w-4 h-4 text-indigo-600" />;
      case 'project':
        return <FolderKanban className="w-4 h-4 text-purple-600" />;
      case 'student':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load notifications" message={error} onRetry={fetchNotifications} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Instructor Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">Course activity alerts, at-risk flags, and automated grading notifications.</p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up."
          message="You have no new notifications at this time."
          actionLabel="Refresh Notifications"
          onAction={fetchNotifications}
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                notif.read ? 'bg-slate-50 border-slate-100' : 'bg-rose-50/30 border-rose-200/60'
              }`}
            >
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs shrink-0">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                  <span className="text-[10px] font-semibold text-slate-400">{notif.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorNotificationsPage;
