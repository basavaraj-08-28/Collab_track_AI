import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { 
  Activity, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  Code2, 
  Award, 
  RefreshCw,
  FolderKanban,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export const CollaborationActivityPage = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const fetchActivities = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await studentService.getActivity(activeFilter);
      setActivities(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve collaboration activity timeline.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activeFilter]);

  const getIcon = (type = '') => {
    const t = String(type).toLowerCase();
    if (t.includes('task')) {
      return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
    if (t.includes('message') || t.includes('discussion')) {
      return <MessageSquare className="w-4 h-4 text-indigo-600" />;
    }
    if (t.includes('document') || t.includes('upload') || t.includes('file')) {
      return <FileText className="w-4 h-4 text-emerald-600" />;
    }
    if (t.includes('project') || t.includes('enroll')) {
      return <FolderKanban className="w-4 h-4 text-violet-600" />;
    }
    if (t.includes('review') || t.includes('code')) {
      return <Code2 className="w-4 h-4 text-purple-600" />;
    }
    if (t.includes('feedback') || t.includes('score')) {
      return <Award className="w-4 h-4 text-amber-600" />;
    }
    return <Activity className="w-4 h-4 text-slate-600" />;
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
        <ErrorState title="Unable to load activities" message={error} onRetry={() => fetchActivities(false)} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Collaboration Activity Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real activity events automatically recorded from your task deliverables, discussions, and project contributions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Refresh Button */}
          <button
            onClick={() => fetchActivities(true)}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Refresh Timeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

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
      </div>

      {activities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Collaboration Activity Yet"
          message="Your contributions, task completions, and discussion posts will be automatically tracked here."
          actionLabel="Refresh Activity Feed"
          onAction={() => fetchActivities(false)}
        />
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative space-y-6">
          <div className="absolute left-9 sm:left-11 top-10 bottom-10 w-0.5 bg-slate-200 -z-0" />

          {activities.map((act) => {
            const scoreVal = act.scoreChange ?? act.score_change ?? 0;
            const detailsText = act.details || act.description || 'Recorded sprint collaboration event.';

            return (
              <div key={act.id} className="flex items-start gap-4 sm:gap-6 relative z-10 animate-in fade-in duration-150">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
                  {getIcon(act.type)}
                </div>

                <div className="flex-1 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-2 hover:border-indigo-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <UserAvatar name={act.user || 'Student'} avatar={act.avatar} size="sm" />
                      <span className="text-xs font-bold text-slate-900">{act.user || 'Student'}</span>
                      {act.project && (
                        <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">• {act.project}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0">{act.timestamp}</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 leading-snug">{act.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{detailsText}</p>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {scoreVal > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          +{scoreVal} Score Impact
                        </span>
                      )}
                      {act.aiImpact && scoreVal <= 0 && (
                        <Badge variant="ai">{act.aiImpact}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CollaborationActivityPage;

