import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Sparkles, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage = () => {
  const { navigateTo } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    addToast('Password reset link sent to your email address.', 'success');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 sm:p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
          <Sparkles className="w-6 h-6" />
        </div>

        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h2>
        <p className="text-xs text-slate-500 mt-1.5 mb-6">
          Enter your university email to receive a password reset link.
        </p>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-emerald-800 text-xs space-y-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="font-bold">Reset Instructions Sent!</p>
            <p className="text-emerald-700 leading-relaxed">
              We have sent password recovery instructions to <span className="font-bold">{email}</span>. Check your inbox or spam folder.
            </p>
            <button
              onClick={() => navigateTo('login')}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition-colors"
            >
              Return to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            >
              Send Reset Link
            </button>

            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
