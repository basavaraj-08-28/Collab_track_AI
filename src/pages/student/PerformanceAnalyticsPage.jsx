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
import { BarChart3, Calendar, Filter } from 'lucide-react';

export const PerformanceAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('Last 30 days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getAnalytics(dateRange);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve student analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="chart" count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load analytics" message={error} onRetry={fetchAnalytics} />
      </div>
    );
  }

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
            Performance & Collaboration Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic statistical visual analytics generated from real activity records.
          </p>
        </div>

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

      {!hasData ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-8 ring-indigo-50/50">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">Not Enough Data</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analytics will appear as more collaboration activity is recorded.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <button
              onClick={fetchAnalytics}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Reload Analytics
            </button>
          </div>
        </div>
      ) : (
        /* Visualizations Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {analytics.weeklyParticipation && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Weekly Participation</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Line Chart</span>
              </div>
              <ParticipationLineChart data={analytics.weeklyParticipation} />
            </div>
          )}

          {analytics.taskCompletion && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Task Completion Velocity</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Bar Chart</span>
              </div>
              <TaskCompletionBarChart data={analytics.taskCompletion} />
            </div>
          )}

          {analytics.scoreTrend && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Collaboration Score Trend</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Area Chart</span>
              </div>
              <ScoreTrendAreaChart data={analytics.scoreTrend} />
            </div>
          )}

          {analytics.communicationQuality && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Communication Quality Dimensions</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Radar Chart</span>
              </div>
              <QualityRadarChart data={analytics.communicationQuality} />
            </div>
          )}

          {analytics.activityDistribution && (
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Contribution & Activity Distribution</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Donut Chart</span>
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
