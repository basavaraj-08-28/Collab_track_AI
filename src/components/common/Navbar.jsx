import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Shield,
  GraduationCap
} from 'lucide-react';
import UserAvatar from './UserAvatar';

export const Navbar = ({ onToggleSidebar }) => {
  const { role, user, switchRole, navigateTo, logout, unreadNotificationsCount } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div
          onClick={() =>
            navigateTo(
              role === 'instructor' ? 'instructor-dashboard' : role === 'student' ? 'student-dashboard' : 'landing'
            )
          }
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                COLLAB TRACK AI
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase hidden sm:block">
              AI-Powered Collaboration Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Switcher Pill */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => switchRole('student')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              role === 'student'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
          <button
            onClick={() => switchRole('instructor')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              role === 'instructor'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Instructor</span>
          </button>
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => {
            if (role === 'instructor') {
              navigateTo('instructor-notifications');
            }
          }}
          className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* User Dropdown */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <UserAvatar name={user.name || 'User'} avatar={user.avatar} size="sm" />
              <div className="hidden xl:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name || 'Authenticated User'}</p>
                <p className="text-[10px] font-medium text-slate-500 capitalize">{role}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{user.name || 'Authenticated User'}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user.email || 'user@university.edu'}</p>
                </div>
                <button
                  onClick={() => {
                    navigateTo(role === 'instructor' ? 'instructor-profile' : 'student-profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigateTo('login')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
