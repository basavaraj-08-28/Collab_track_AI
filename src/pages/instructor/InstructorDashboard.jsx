import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import UserAvatar from '../../components/common/UserAvatar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Shield, FolderKanban, Users, Award, AlertTriangle, ArrowRight, PlusCircle, Brain } from 'lucide-react';

export const InstructorDashboard = () => {
  const { user, navigateTo } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await instructorService.getDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Unable to retrieve instructor dashboard.');
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
        <SkeletonLoader count={4} height="h-28" />
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
  const totalStudents = data?.stats?.totalStudents ?? data?.totalStudents ?? 0;
  const activeProjectsCount = data?.stats?.activeProjects ?? data?.activeProjectsCount ?? projects.length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Instructor Dashboard 🛡️
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
            Monitor real student collaboration, track project velocity, and manage course projects.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateTo('create-project')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Statistics Row - Clean 2-card layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <StatCard
          title="Active Projects"
          value={projects.length === 1 ? '1 Project' : `${projects.length} Projects`}
          subtext={projects.length > 0 ? `${activeProjectsCount} Active` : 'No projects created'}
          icon={FolderKanban}
          iconBg="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Total Enrolled Students"
          value={totalStudents === 1 ? '1 Student' : `${totalStudents} Students`}
          subtext={totalStudents > 0 ? 'Assigned across projects' : 'No students added yet'}
          icon={Users}
          iconBg="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Active Projects Grid / Empty State */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900">Active Course Projects</h3>
          {projects.length > 0 && (
            <button
              onClick={() => navigateTo('manage-projects')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Manage All Projects →
            </button>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No Projects Yet"
            message="Create your first project to start tracking student collaboration."
            actionLabel="Create Project"
            onAction={() => navigateTo('create-project')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => {
              const count = proj.enrolled_students !== undefined ? proj.enrolled_students : (proj.student_count !== undefined ? proj.student_count : (proj.members || []).length);
              return (
                <div
                  key={proj.id}
                  onClick={() => navigateTo('instructor-project-details', { projectId: proj.id })}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {proj.code || 'PROJECT'}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{proj.name}</h4>
                    </div>
                    <Badge variant={proj.status === 'Active' ? 'success' : 'warning'}>
                      {proj.status || 'Active'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs my-4">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Progress</span>
                      <span className="font-extrabold text-slate-900">{proj.progress || 0}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Tasks</span>
                      <span className="font-extrabold text-slate-900">
                        {proj.tasksCompleted || 0}/{proj.totalTasks || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase block">Avg Score</span>
                      <span className="font-extrabold text-indigo-600">
                        {proj.collaborationScore ? proj.collaborationScore : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{count} Enrolled Student{count === 1 ? '' : 's'}</span>
                    </div>
                    <span className="font-bold text-indigo-600 flex items-center gap-1">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;
