import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import StatCard from '../../components/common/StatCard';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import UserAvatar from '../../components/common/UserAvatar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import {
  Award,
  CheckSquare,
  Activity,
  MessageSquare,
  ArrowRight,
  Brain,
  Sparkles,
  FolderKanban,
  AlertCircle,
  Clock
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user, navigateTo } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await studentService.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-28 bg-slate-200/80 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonLoader count={4} height="h-28" />
        </div>
        <SkeletonLoader count={2} height="h-44" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load dashboard" message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  const projects = data?.projects || [];
  const activities = data?.activities || [];
  const scoreData = data?.score;
  const hasScore = scoreData && scoreData.overall !== undefined && scoreData.overall !== null;

  const realName = user?.name || 'Student';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Hello, {realName} 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Here’s your collaboration overview for this workspace.
          </p>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Projects"
          value={projects.length}
          subtext={projects.length > 0 ? `${projects.length} assigned project(s)` : 'No active projects'}
          trend={projects.length > 0 ? 'Assigned' : 'Empty'}
          trendType={projects.length > 0 ? 'up' : 'neutral'}
          icon={FolderKanban}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Tasks Completed"
          value={data?.totalTasks ? `${data.tasksCompleted} / ${data.totalTasks}` : '0 / 0'}
          subtext={data?.totalTasks ? `${Math.round((data.tasksCompleted / data.totalTasks) * 100)}% Completed` : 'Sprint deliverables'}
          trend={data?.tasksCompleted > 0 ? `+${data.tasksCompleted} completed` : '0 completed'}
          trendType={data?.tasksCompleted > 0 ? 'up' : 'neutral'}
          icon={CheckSquare}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Deliverables"
          value={data?.stats?.pendingTasks ?? (data?.totalTasks ? data.totalTasks - (data.tasksCompleted || 0) : 0)}
          subtext="Assigned tasks in sprint"
          trend="Deliverables"
          trendType="neutral"
          icon={Clock}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Discussion Updates"
          value={activities.length}
          subtext="Recent workspace activities"
          trend="Live Activity"
          trendType="up"
          icon={MessageSquare}
          iconBg="bg-purple-50 text-purple-600"
        />
      </div>

      {/* AI Assessment Spotlight Card */}
      {hasScore ? (
        <div
          onClick={() => navigateTo('student-analytics')}
          className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-700/40 cursor-pointer hover:border-indigo-500/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  AI Academic Progress Insights
                </span>
                <Badge variant="ai">Active</Badge>
              </div>
              <p className="text-xs text-slate-200 mt-1 max-w-2xl leading-relaxed">
                "{scoreData.aiAssessment || 'Your project progress and deliverable milestones are tracked in real-time.'}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-white transition-colors shrink-0">
            <span>View Analytics</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 p-6 rounded-3xl text-white border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Workspace Overview
              </span>
              <p className="text-xs text-slate-300 mt-1">
                Your deliverables and project updates will appear automatically as you work on assigned tasks.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigateTo('my-projects')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0"
          >
            Go to My Projects
          </button>
        </div>
      )}

      {/* Main Grid: Active Projects & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Projects Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
              Active Projects
            </h3>
            {projects.length > 0 && (
              <button
                onClick={() => navigateTo('my-projects')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                View All Projects →
              </button>
            )}
          </div>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Projects Assigned"
              message="Your assigned projects will appear here when an instructor adds you to a project."
              actionLabel="Refresh Projects"
              onAction={fetchDashboardData}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => navigateTo('project-details', { projectId: proj.id })}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {proj.code || 'PROJECT'} • {proj.group || 'Team'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {proj.name}
                      </h4>
                    </div>
                    <Badge variant={proj.status === 'Active' ? 'success' : 'warning'}>
                      {proj.status || 'Active'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{proj.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4 pt-3 border-t border-slate-100">
                    <ProgressBar value={proj.progress || 0} label="Sprint Progress" />
                    <div className="text-right">
                      <span className="text-xs text-slate-500 font-medium block">Collaboration Score</span>
                      <span className="text-sm font-extrabold text-indigo-600">
                        {proj.collaborationScore !== null && proj.collaborationScore !== undefined
                          ? `${proj.collaborationScore} / 100`
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center -space-x-2">
                      {(proj.members || []).map((m, idx) => (
                        <UserAvatar key={idx} name={m.name} avatar={m.avatar} size="sm" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {proj.lastActivity ? `Last active ${proj.lastActivity}` : 'Recently updated'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Recent Activity
            </h3>
          </div>

          {activities.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Activity Logged"
              message="Your sprint activities and task submissions will appear here as you participate."
            />
          ) : (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <UserAvatar name={act.user || realName} avatar={act.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{act.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{act.details}</p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px]">
                      <span className="text-slate-400">{act.timestamp}</span>
                      {act.aiImpact && (
                        <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                          {act.aiImpact}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
