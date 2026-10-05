import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  Brain,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  Award,
  Zap,
  Users,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo';
import ScoreCircle from '../../components/common/ScoreCircle';

export const LandingPage = () => {
  const { navigateTo, user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigateTo(user.role === 'instructor' ? 'instructor-dashboard' : 'student-dashboard');
    } else {
      navigateTo('register');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Floating Header */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <BrandLogo size="lg" onClick={() => navigateTo('landing')} />

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateTo('login')}
            className="text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={handleGetStarted}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-105"
          >
            Get Started Free
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold mb-6">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Next-Generation Academic NLP & Contribution Analytics</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight mb-6">
          Understand Collaboration.{' '}
          <span className="gradient-text">Measure Contribution.</span> Improve Teamwork.
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-8">
          Collab Track AI uses artificial intelligence, machine learning and NLP to analyze team collaboration and provide transparent, data-driven contribution insights.
        </p>

        <div className="flex items-center justify-center mb-16">
          <button
            onClick={handleGetStarted}
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hero Visual Dashboard Preview */}
        <div className="relative max-w-5xl mx-auto rounded-3xl bg-slate-900 p-4 sm:p-6 shadow-2xl border border-slate-800 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono text-slate-400">collabtrack.ai/dashboard/demo</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
              ● Live AI Processing
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Score Box */}
            <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 flex flex-col items-center justify-center text-center">
              <ScoreCircle score={84} size={150} label="Excellent Collaboration" sublabel="Top 10% Class Rank" />
              <div className="mt-4 w-full pt-4 border-t border-slate-700 text-xs text-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span>Task Velocity:</span>
                  <span className="text-emerald-400 font-bold">88 / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>NLP Quality:</span>
                  <span className="text-indigo-400 font-bold">81 / 100</span>
                </div>
              </div>
            </div>

            {/* Middle Feature Stream */}
            <div className="lg:col-span-2 bg-slate-800/40 rounded-2xl p-6 border border-slate-700/50 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-bold flex items-center gap-2 text-indigo-400">
                  <Brain className="w-4 h-4" /> AI Contribution Classification
                </span>
                <span className="text-slate-400">Updated 2m ago</span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/60 text-xs text-slate-200">
                <p className="font-semibold text-indigo-300 mb-1">🧠 NLP Assessment Narrative</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  "Enrolled students lead technical code contributions with verified deliverable updates and high constructive sentiment in team sprint planning."
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-[10px]">Tasks Done</p>
                  <p className="text-lg font-bold text-white">18 / 24</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-[10px]">Peer Impact</p>
                  <p className="text-lg font-bold text-emerald-400">+2.5 pts</p>
                </div>
                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                  <p className="text-slate-400 text-[10px]">Participation</p>
                  <p className="text-lg font-bold text-indigo-400">88%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Collab Track AI Section */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Why Collab Track AI?
            </h2>
            <p className="text-sm text-slate-600">
              Eliminate free-rider problems in student group projects with transparent, objective AI contribution tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Analysis',
                desc: 'Evaluates task completions, code commits, and discussions using NLP neural models.'
              },
              {
                icon: TrendingUp,
                title: 'Individual Contribution Tracking',
                desc: 'Deep breakdown showing exact work delivered by each team member with velocity metrics.'
              },
              {
                icon: MessageSquare,
                title: 'NLP Communication Analysis',
                desc: 'Measures constructive sentiment, clarity, technical feedback, and response frequency.'
              },
              {
                icon: Award,
                title: 'Automated Collaboration Scoring',
                desc: 'Generates transparent 0–100 scores based on weighted parameters configured by instructors.'
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                desc: 'Interactive Recharts visualizations showing weekly participation and task completion trends.'
              },
              {
                icon: ShieldCheck,
                title: 'Transparent Evaluation',
                desc: 'Provides students and instructors with clear explanations of how grades are computed.'
              }
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">How It Works</h2>
          <p className="text-sm text-slate-600">A seamless 4-step automated pipeline from data to grade generation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { step: '01', title: 'Collect Collaboration Data', desc: 'Syncs task completions, discussion posts, files, and peer reviews.' },
            { step: '02', title: 'Analyze with AI', desc: 'Processes text quality, velocity, and communication sentiment via NLP.' },
            { step: '03', title: 'Generate Contribution Score', desc: 'Calculates overall 0-100 score with granular component breakdown.' },
            { step: '04', title: 'Improve Team Performance', desc: 'Delivers actionable recommendations and fair AI-assisted grading.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <span className="text-3xl font-black text-indigo-200 block mb-3 font-mono">{item.step}</span>
              <h4 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-slate-900 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Make Collaboration Measurable.</h2>
          <p className="text-sm sm:text-base text-slate-400 mb-8 max-w-xl mx-auto">
            Transform student group project grading with data-driven transparency and AI insight.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition-all hover:scale-105"
          >
            Start Tracking Now
          </button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
