import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import { useAuth } from '../../context/AuthContext';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import { Bell, Check, AlertTriangle, Brain, FolderKanban, GraduationCap, Clock, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

export const InstructorNotificationsPage = () => {
  const { navigateTo, setUnreadNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getNotifications();
      const notifList = Array.isArray(data) ? data : [];
      setNotifications(notifList);
      const unread = notifList.filter((n) => !n.read).length;
      if (setUnreadNotificationsCount) setUnreadNotificationsCount(unread);
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
    if (setUnreadNotificationsCount) setUnreadNotificationsCount(0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-amber-600" />;
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

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'All') return true;
    if (filter === 'Deadlines') return notif.type === 'deadline';
    if (filter === 'Alerts') return notif.type !== 'deadline';
    return true;
  });

  const deadlineCount = notifications.filter((n) => n.type === 'deadline').length;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-24" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Instructor Notifications
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Active project deadline countdowns, student activity alerts, and automated course notices.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setFilter('All')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'All'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('Deadlines')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
            filter === 'Deadlines'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Project Deadlines ({deadlineCount})</span>
        </button>
        <button
          onClick={() => setFilter('Alerts')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            filter === 'Alerts'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Activity Alerts ({notifications.length - deadlineCount})
        </button>
      </div>

      {filteredNotifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up."
          message={
            filter === 'Deadlines'
              ? 'No active projects with upcoming deadlines at this time.'
              : 'You have no new notifications at this time.'
          }
          actionLabel="Refresh Notifications"
          onAction={fetchNotifications}
        />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isDeadline = notif.type === 'deadline';
            const daysLeft = notif.daysRemaining;

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDeadline
                    ? daysLeft <= 1
                      ? 'bg-rose-50/70 border-rose-300 shadow-xs'
                      : daysLeft <= 5
                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                      : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                    : notif.read
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 shadow-2xs ${
                        isDeadline
                          ? daysLeft <= 1
                            ? 'bg-rose-600 text-white'
                            : daysLeft <= 5
                            ? 'bg-amber-600 text-white'
                            : 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {getIcon(notif.type)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                        {isDeadline && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              daysLeft === 0
                                ? 'bg-rose-600 text-white animate-pulse'
                                : daysLeft === 1
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : daysLeft <= 5
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {daysLeft === 0
                              ? 'Due Today'
                              : daysLeft === 1
                              ? '1 Day Remaining'
                              : `${daysLeft} Days Remaining`}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{notif.description}</p>

                      {isDeadline && notif.deadline && (
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 font-medium">
                          <span className="flex items-center gap-1 text-slate-700 font-bold">
                            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                            Target Deadline: {notif.deadline}
                          </span>
                          {notif.projectId && (
                            <button
                              type="button"
                              onClick={() =>
                                navigateTo('instructor-project-details', { projectId: notif.projectId })
                              }
                              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors ml-auto"
                            >
                              <span>Inspect Project Deliverables</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                    {notif.timestamp}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InstructorNotificationsPage;
