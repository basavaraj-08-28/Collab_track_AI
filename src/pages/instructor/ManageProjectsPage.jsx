import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { FolderKanban, PlusCircle, Edit, Trash2, Eye } from 'lucide-react';

export const ManageProjectsPage = () => {
  const { navigateTo } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEdit, setSelectedEdit] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve projects list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id, name) => {
    try {
      await instructorService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      addToast(`Project "${name}" deleted successfully.`, 'success');
    } catch (err) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      addToast(`Project "${name}" removed.`, 'warning');
    }
  };

  const columns = [
    {
      header: 'Project Name',
      key: 'name',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.code || 'CODE'}</span>
        </div>
      )
    },
    {
      header: 'Group',
      key: 'group',
      render: (val, row) => <Badge variant="blue">{val || row.groupName || 'Unassigned'}</Badge>
    },
    {
      header: 'Progress',
      key: 'progress',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full" style={{ width: `${val || 0}%` }} />
          </div>
          <span className="font-bold text-xs text-slate-700">{val || 0}%</span>
        </div>
      )
    },
    {
      header: 'Avg Score',
      key: 'collaborationScore',
      render: (val) => <span className="font-extrabold text-indigo-600">{val ? `${val} / 100` : 'Pending'}</span>
    },
    {
      header: 'Tasks',
      key: 'tasksCompleted',
      render: (val, row) => `${val || 0} / ${row.totalTasks || 0}`
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => <Badge variant={val === 'Active' ? 'success' : 'warning'}>{val || 'Active'}</Badge>
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateTo('instructor-project-details', { projectId: row.id })}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Inspect Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedEdit(row)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row.id, row.name)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load projects" message={error} onRetry={fetchProjects} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-600" />
            Manage Course Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">Overview of all active and completed student group projects.</p>
        </div>

        <button
          onClick={() => navigateTo('create-project')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Created Yet"
          message="Create a project to begin managing student collaboration."
          actionLabel="Create Project"
          onAction={() => navigateTo('create-project')}
        />
      ) : (
        <DataTable columns={columns} data={projects} searchPlaceholder="Search course projects..." />
      )}

      {/* Edit Modal */}
      {selectedEdit && (
        <Modal
          isOpen={!!selectedEdit}
          onClose={() => setSelectedEdit(null)}
          title={`Edit Project: ${selectedEdit.name}`}
          footer={
            <>
              <button
                onClick={() => setSelectedEdit(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addToast('Project details updated successfully!', 'success');
                  setSelectedEdit(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl shadow-xs"
              >
                Save Changes
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                defaultValue={selectedEdit.name}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select defaultValue={selectedEdit.status || 'Active'} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageProjectsPage;
