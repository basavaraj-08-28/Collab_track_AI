import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';

export const LoginPage = () => {
  const { login, navigateTo } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast('Please enter your email and password.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(email, password);
      addToast(`Signed in successfully! Welcome, ${res.user?.name || 'User'}.`, 'success');
    } catch (err) {
      addToast(err.message || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side Visual Branding */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden hidden lg:flex">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

          <div>
            <div className="mb-8">
              <BrandLogo size="lg" theme="light-text" showSubtitle={false} onClick={() => navigateTo('landing')} />
            </div>

            <h2 className="text-2xl font-black tracking-tight leading-tight mb-4">
              AI-Powered Student Collaboration Tracking & Grading System
            </h2>
            <p className="text-xs text-indigo-200 leading-relaxed">
              Log in to access real-time contribution metrics, AI insights, peer feedback, and automated course evaluations.
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center justify-between text-indigo-300 font-bold">
              <span>● Production API & Database Authentication</span>
              <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full">v1.0</span>
            </div>
            <p className="text-[11px] text-slate-300">
              "Continuous NLP evaluation ensures fair, transparent grading for all team members."
            </p>
          </div>
        </div>

        {/* Right Side Form Card */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="lg:hidden mb-6 flex justify-center">
            <BrandLogo size="md" onClick={() => navigateTo('landing')} />
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h3>
            <p className="text-xs text-slate-500 mt-1">Please enter your registered email and password to log in.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="e.g. user@university.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => navigateTo('forgot-password')}
                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <button onClick={() => navigateTo('register')} className="font-bold text-indigo-600 hover:underline">
                Create one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
