import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import ParticipationLineChart from '../../components/charts/ParticipationLineChart';
import TaskCompletionBarChart from '../../components/charts/TaskCompletionBarChart';
import ScoreTrendAreaChart from '../../components/charts/ScoreTrendAreaChart';
import QualityRadarChart from '../../components/charts/QualityRadarChart';
import ActivityDonutChart from '../../components/charts/ActivityDonutChart';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  FileText, 
  MessageSquare, 
  Sparkles, 
  TrendingUp, 
  CheckSquare, 
  Clock, 
  Award,
  RefreshCw
} from 'lucide-react';

export const PerformanceAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await studentService.getAnalytics(dateRange);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve student analytics.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading && !analytics) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="chart" count={2} />
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load analytics" message={error} onRetry={() => fetchAnalytics(false)} />
      </div>
    );
  }

  const summary = analytics?.summary;
  const hasData =
    analytics &&
    (analytics.weeklyParticipation?.length > 0 ||
      analytics.taskCompletion?.length > 0 ||
      analytics.scoreTrend?.length > 0 ||
      analytics.communicationQuality?.length > 0 ||
      analytics.activityDistribution?.length > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Date Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Performance & Deliverable Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time statistical evaluation computed directly from your tasks, deliverables, and team participation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Refresh Analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Date Range Selector */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-semibold overflow-x-auto">
            {['Last 7 days', 'Last 30 days', 'This semester', 'Custom range'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                  dateRange === range ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performance KPI Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completion Velocity</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.completionRate}%</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Sprint Task Rate</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tasks Completed</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.completedTasks} / {summary.totalTasks}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">{summary.pendingTasks} pending deliverables</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents / PDFs</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.filesUploaded}</h3>
              <p className="text-[11px] text-indigo-600 font-bold mt-0.5">Uploaded Deliverables</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Discussions</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{summary.discussionCount}</h3>
              <p className="text-[11px] text-purple-600 font-bold mt-0.5">Team Contributions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Performance Analysis Narrative */}
      {summary?.analysisNarrative && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-lg border border-indigo-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Performance Evaluation Narrative
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black">
                  Grade: {summary.performanceGrade || 'A'}
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1.5 max-w-3xl leading-relaxed">
                {summary.analysisNarrative}
              </p>
            </div>
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-8 ring-indigo-50/50">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">No Analytics Recorded Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Performance charts will dynamically visualize as sprint tasks and deliverables are completed.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => fetchAnalytics(false)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Reload Analytics
            </button>
          </div>
        </div>
      ) : (
        /* Visualizations Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {analytics.taskCompletion && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Task Completion Velocity</h3>
                  <p className="text-[11px] text-slate-400">Completed vs Assigned Tasks across projects</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Bar Chart</span>
              </div>
              <TaskCompletionBarChart data={analytics.taskCompletion} />
            </div>
          )}

          {analytics.weeklyParticipation && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Weekly Activity Frequency</h3>
                  <p className="text-[11px] text-slate-400">Activity engagement frequency across weekdays</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Line Chart</span>
              </div>
              <ParticipationLineChart data={analytics.weeklyParticipation} />
            </div>
          )}

          {analytics.scoreTrend && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Sprint Progression Trend</h3>
                  <p className="text-[11px] text-slate-400">Weekly milestone completion velocity</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Area Chart</span>
              </div>
              <ScoreTrendAreaChart data={analytics.scoreTrend} />
            </div>
          )}

          {analytics.communicationQuality && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Performance Quality Dimensions</h3>
                  <p className="text-[11px] text-slate-400">Multi-factor deliverable and participation index</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Radar Chart</span>
              </div>
              <QualityRadarChart data={analytics.communicationQuality} />
            </div>
          )}

          {analytics.activityDistribution && (
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Contribution Weight Distribution</h3>
                  <p className="text-[11px] text-slate-400">Proportional breakdown of tasks, discussions, and document uploads</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Donut Chart</span>
              </div>
              <ActivityDonutChart data={analytics.activityDistribution} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalyticsPage;

