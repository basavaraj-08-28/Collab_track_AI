import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import { useToast } from '../../context/ToastContext';
import AIInsightCard from '../../components/AI/AIInsightCard';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Brain, Sparkles, RefreshCw, Bot, ArrowRight, ShieldCheck } from 'lucide-react';

export const AIInsightsPage = () => {
  const { addToast } = useToast();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getAIInsights();
      setInsights(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve AI Insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleGenerateAnalysis = async () => {
    setAnalyzing(true);
    addToast('Initiating machine learning evaluation of tasks & collaboration metrics...', 'info');

    try {
      const res = await studentService.triggerAIAnalysis();
      setAnalyzing(false);
      addToast('✨ AI Collaboration Analysis complete! Insights updated.', 'success');
      fetchInsights();
    } catch (err) {
      setAnalyzing(false);
      addToast('AI Analysis execution failed.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={4} height="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load AI Insights" message={error} onRetry={fetchInsights} />
      </div>
    );
  }

  const hasInsights = insights && (insights.summary || (insights.cards && insights.cards.length > 0));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            AI Collaboration Insights
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Machine learning & NLP evaluation of code velocity, communication sentiment, and peer collaboration patterns.
          </p>
        </div>

        <button
          onClick={handleGenerateAnalysis}
          disabled={analyzing}
          className="px-5 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          <span>{analyzing ? 'Analyzing Collaboration Data...' : 'Run AI Analysis'}</span>
        </button>
      </div>

      {analyzing && (
        <div className="bg-indigo-50 border border-indigo-200/80 rounded-3xl p-6 flex items-center gap-4 animate-pulse">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900">AI Model Execution in Progress</h4>
            <p className="text-xs text-indigo-700 mt-0.5">
              Evaluating NLP message sentiment, sprint deliverable velocity, and project activity logs...
            </p>
          </div>
        </div>
      )}

      {!hasInsights ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-8 ring-indigo-50/50">
            <Brain className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">No AI Insights Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              AI insights will be generated after your collaboration data is analyzed.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={handleGenerateAnalysis}
              disabled={analyzing}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run First AI Assessment</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* AI Assistant Banner */}
          {insights.summary && (
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-700/40 relative overflow-hidden flex items-start gap-4">
              <div className="p-3.5 bg-indigo-500/20 rounded-2xl text-indigo-300 ring-1 ring-indigo-400/30 shrink-0">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Collab Track AI Model Stream
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Active Assessment
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Personalized Recommendation Summary</h3>
                <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">{insights.summary}</p>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {insights.cards && insights.cards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {insights.cards.map((card) => (
                <AIInsightCard
                  key={card.id || Math.random()}
                  category={card.category}
                  title={card.title}
                  description={card.description}
                  badge={card.badge}
                  color={card.color}
                  iconName={card.icon}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIInsightsPage;
