import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

export const AIEvaluationSummary = ({ score = 84, narrative, strengths = [], improvements = [] }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-700/40 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Collaboration Assessment</h3>
            <p className="text-[11px] text-indigo-300">Natural Language & Behavioral Analysis</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-xs rounded-full">
          Score: {score} / 100
        </span>
      </div>

      {narrative && (
        <p className="text-xs text-slate-200 leading-relaxed bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 mb-6">
          "{narrative}"
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Key Strengths
          </h4>
          <ul className="space-y-2">
            {strengths.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas to Improve */}
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Areas to Improve
          </h4>
          <ul className="space-y-2">
            {improvements.map((item, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIEvaluationSummary;
