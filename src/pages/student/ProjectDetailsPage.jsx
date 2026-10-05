import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import UserAvatar from '../../components/common/UserAvatar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { FolderKanban, CheckSquare, Users, FileText, Upload, Calendar, ArrowLeft, Award, Sparkles } from 'lucide-react';

export const ProjectDetailsPage = () => {
  const { selectedProjectId, navigateTo } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedProjectId) {
        setProject(null);
        setLoading(false);
        return;
      }
      const res = await studentService.getProjectById(selectedProjectId);
      setProject(res);
    } catch (err) {
      setError(err.message || 'Unable to retrieve project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetails();
  }, [selectedProjectId]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      addToast(`Uploaded "${file.name}" to project repository. AI analyzing contribution...`, 'success');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <SkeletonLoader count={3} height="h-32" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load project details" message={error} onRetry={fetchProjectDetails} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <button
          onClick={() => navigateTo('my-projects')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>

        <EmptyState
          icon={FolderKanban}
          title="No Project Selected"
          message="Please select an assigned project from your project list to view its details."
          actionLabel="View My Projects"
          onAction={() => navigateTo('my-projects')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => navigateTo('my-projects')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {project.code && <Badge variant="primary">{project.code}</Badge>}
              {project.group && <Badge variant="blue">{project.group}</Badge>}
              <Badge variant={project.status === 'Active' ? 'success' : 'warning'}>
                {project.status || 'Active'}
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{project.description || 'No project description provided.'}</p>
          </div>

          <label className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Progress & Score Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Milestone Velocity</span>
          <ProgressBar value={project.progress || 0} label="Sprint Progress" height="h-3" />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tasks Deliverables</span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {project.tasksCompleted || 0} / {project.totalTasks || 0}
            </h3>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Assigned Deliverables</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <CheckSquare className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Score</span>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">
              {project.collaborationScore !== null && project.collaborationScore !== undefined
                ? `${project.collaborationScore} / 100`
                : 'Pending'}
            </h3>
            <p className="text-[11px] text-indigo-600 font-bold mt-0.5">Calculated by AI</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Team Roster Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Team Roster & Roles
        </h3>

        {!project.members || project.members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Team Members Listed"
            message="Team member roster will be displayed once members are added by the instructor."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {project.members.map((member, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <UserAvatar name={member.name} avatar={member.avatar} size="md" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                  <p className="text-[10px] font-medium text-slate-500">{member.role || 'Member'}</p>
                  {member.score && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      Score: {member.score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
