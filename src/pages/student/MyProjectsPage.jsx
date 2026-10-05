import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import UserAvatar from '../../components/common/UserAvatar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { FolderKanban, Search, ArrowRight, Calendar } from 'lucide-react';

export const MyProjectsPage = () => {
  const { navigateTo } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load your projects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filtered = projects.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.code || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="cards" count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load your projects" message={error} onRetry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-600" />
            My Assigned Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying only projects assigned to your account by course instructors.
          </p>
        </div>

        {/* Search Input */}
        {projects.length > 0 && (
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Assigned"
          message="Your assigned projects will appear here when an instructor adds you to a project."
          actionLabel="Refresh Projects List"
          onAction={fetchProjects}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching projects found"
          message={`No assigned projects match the search query "${search}".`}
          actionLabel="Clear Search"
          onAction={() => setSearch('')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((proj) => (
            <div
              key={proj.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {proj.code || 'CS-PROJECT'} • {proj.group || 'Group'}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{proj.name}</h3>
                  </div>
                  <Badge variant={proj.status === 'Active' ? 'success' : 'warning'}>
                    {proj.status || 'Active'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-6 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                <div className="space-y-4 mb-6">
                  <ProgressBar value={proj.progress || 0} label="Overall Sprint Progress" />

                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Tasks Completed</span>
                      <span className="font-extrabold text-slate-900">
                        {proj.tasksCompleted || 0} / {proj.totalTasks || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Collaboration Score</span>
                      <span className="font-extrabold text-indigo-600">
                        {proj.collaborationScore !== null && proj.collaborationScore !== undefined
                          ? `${proj.collaborationScore} / 100`
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {proj.deadline && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Deadline: {proj.deadline}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-2">
                    {(proj.members || []).map((m, idx) => (
                      <UserAvatar key={idx} name={m.name} avatar={m.avatar} size="sm" />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium ml-1">
                    {(proj.members || []).length} Team Members
                  </span>
                </div>

                <button
                  onClick={() => navigateTo('project-details', { projectId: proj.id })}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProjectsPage;
