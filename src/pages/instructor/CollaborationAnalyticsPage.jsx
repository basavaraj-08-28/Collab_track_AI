import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import GroupComparisonChart from '../../components/charts/GroupComparisonChart';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { BarChart3 } from 'lucide-react';

export const CollaborationAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instructorService.getAnalytics();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to retrieve course analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <SkeletonLoader count={3} height="h-64" />
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

  const hasData = data && Array.isArray(data) && data.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Course Collaboration Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">Aggregate metrics across all active course groups and student cohorts.</p>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="No Collaboration Data Available"
          message="Student collaboration data will appear after students begin participating in projects."
          actionLabel="Refresh Analytics"
          onAction={fetchAnalytics}
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">Group Performance Comparison Index</h3>
          <GroupComparisonChart data={data} />
        </div>
      )}
    </div>
  );
};

export default CollaborationAnalyticsPage;
