import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Activity,
  MessageSquare,
  Award,
  BarChart3,
  Brain,
  Bell,
  User,
  LogOut,
  Users,
  PlusCircle,
  GraduationCap,
  ShieldCheck,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, currentPage, navigateTo, logout, user } = useAuth();

  const studentLinks = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-projects', label: 'My Projects', icon: FolderKanban },
    { id: 'my-tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'collaboration-activity', label: 'Collaboration', icon: Activity },
    { id: 'messages', label: 'Discussions', icon: MessageSquare },
    { id: 'my-score', label: 'My Score', icon: Award, highlight: true },
    { id: 'student-analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'student-profile', label: 'Profile', icon: User },
  ];

  const instructorLinks = [
    { id: 'instructor-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-project', label: 'Create Project', icon: PlusCircle },
    { id: 'manage-projects', label: 'Manage Projects', icon: FolderKanban },
    { id: 'student-contributions', label: 'Student Contributions', icon: GraduationCap },
    { id: 'student-performance', label: 'Student Performance', icon: Users },
    { id: 'instructor-profile', label: 'Profile', icon: User },
    { id: 'instructor-notifications', label: 'Notifications', icon: Bell },
  ];

  const links = role === 'instructor' ? instructorLinks : studentLinks;

  const hasScore = user?.overallScore !== null && user?.overallScore !== undefined;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Items */}
        <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {role === 'instructor' ? 'Instructor Portal' : 'Student Portal'}
          </div>

          {links.map((link) => {
            const Icon = link.icon;
            const isActive = currentPage === link.id;

            return (
              <button
                key={link.id}
                onClick={() => {
                  navigateTo(link.id);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Score Preview Card & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
          {role === 'student' ? (
            <div
              onClick={() => navigateTo('my-score')}
              className="bg-gradient-to-br from-indigo-900/60 to-slate-900 border border-indigo-700/40 p-3.5 rounded-2xl cursor-pointer hover:border-indigo-500/60 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-indigo-300 font-semibold">Collaboration Score</span>
                {hasScore ? (
                  <span className="text-emerald-400 font-bold">{user.overallScore} / 100</span>
                ) : (
                  <span className="text-slate-400 font-semibold text-[11px]">No Score Yet</span>
                )}
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                  style={{ width: `${hasScore ? user.overallScore : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                <span>{hasScore ? (user.scoreLabel || 'Active Collaborator') : 'Requires activity data'}</span>
                <span className="text-indigo-400 underline font-semibold">Details →</span>
              </p>
            </div>
          ) : (
            <div
              onClick={() => navigateTo('instructor-dashboard')}
              className="bg-gradient-to-br from-slate-900 to-indigo-950/70 border border-indigo-800/40 p-3.5 rounded-2xl cursor-pointer hover:border-indigo-600/60 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-indigo-300 font-semibold">Instructor View</span>
                <span className="text-indigo-400 font-bold">Active</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Course & Student Management</p>
            </div>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
