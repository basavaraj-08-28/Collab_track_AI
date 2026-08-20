import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Activity, CheckCircle2, MessageSquare, FileText, Code2, Award, Filter } from 'lucide-react';

export const CollaborationActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getActivity(activeFilter);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve collaboration activity timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeFilter]);

  const getIcon = (type) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'review':
        return <Code2 className="w-4 h-4 text-purple-600" />;
      case 'feedback':
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={4} height="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load activities" message={error} onRetry={fetchActivities} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Collaboration Activity Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real activity events collected from task updates, project contributions, discussions, and peer feedback.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-semibold overflow-x-auto">
          {['All', 'Task', 'Message', 'Document', 'Review', 'Feedback'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === filter ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Collaboration Activity Yet"
          message="Your collaboration activities will appear here as you participate in projects."
          actionLabel="Refresh Activity Feed"
          onAction={fetchActivities}
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative space-y-6">
          <div className="absolute left-9 sm:left-11 top-10 bottom-10 w-0.5 bg-slate-200 -z-0" />

          {activities.map((act) => (
            <div key={act.id} className="flex items-start gap-4 sm:gap-6 relative z-10">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                {getIcon(act.type)}
              </div>

              <div className="flex-1 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={act.user || 'Student'} avatar={act.avatar} size="sm" />
                    <span className="text-xs font-bold text-slate-900">{act.user || 'Student'}</span>
                    {act.project && (
                      <span className="text-[10px] text-slate-400 font-medium">• {act.project}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{act.timestamp}</span>
                </div>

                <h4 className="text-sm font-bold text-slate-900">{act.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{act.details}</p>

                {act.aiImpact && (
                  <div className="pt-2 flex items-center justify-between">
                    <Badge variant="ai">{act.aiImpact}</Badge>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaborationActivityPage;
