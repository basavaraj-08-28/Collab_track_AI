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
import { FolderKanban, PlusCircle, Edit, Trash2, Eye, Users, User, ArrowRight } from 'lucide-react';

export const ManageProjectsPage = () => {
  const { navigateTo } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEdit, setSelectedEdit] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', status: 'Active', description: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getProjects();
      const projectList = Array.isArray(data) ? data : [];

      // Enrich any project missing group or assignedStudents via getProjectMembers
      const enriched = await Promise.all(
        projectList.map(async (p) => {
          if (p.assignedStudents?.length && (p.group || p.groupName)) {
            return p;
          }
          try {
            const members = await instructorService.getProjectMembers(p.id);
            const groupName =
              p.group ||
              p.groupName ||
              (members && members.find((m) => m.groupName)?.groupName) ||
              null;
            return {
              ...p,
              group: groupName,
              groupName: groupName,
              assignedStudents: p.assignedStudents?.length ? p.assignedStudents : (members || []),
              studentCount: members?.length || p.studentCount || 0
            };
          } catch {
            return p;
          }
        })
      );
      setProjects(enriched);
    } catch (err) {
      setError(err.message || 'Unable to retrieve projects list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOpenEdit = (project) => {
    setSelectedEdit(project);
    setEditForm({
      name: project.name || '',
      status: project.status || 'Active',
      description: project.description || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedEdit) return;
    if (!editForm.name.trim()) {
      addToast('Project name cannot be empty.', 'warning');
      return;
    }

    setIsUpdating(true);
    try {
      await instructorService.updateProject(selectedEdit.id, {
        name: editForm.name.trim(),
        status: editForm.status,
        description: editForm.description
      });

      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedEdit.id
            ? { ...p, name: editForm.name.trim(), status: editForm.status, description: editForm.description }
            : p
        )
      );
      addToast(`Project "${editForm.name}" updated successfully!`, 'success');
      setSelectedEdit(null);
    } catch (err) {
      addToast(err.message || 'Failed to update project.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }
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
      render: (val, row) => {
        const groupName = val || row.groupName;
        if (groupName) {
          return <Badge variant="blue">{groupName}</Badge>;
        }
        const hasStudents =
          (row.assignedStudents && row.assignedStudents.length > 0) ||
          (row.members && row.members.length > 0) ||
          (row.studentCount > 0) ||
          (row.student_count > 0);
        return hasStudents ? (
          <Badge variant="blue">Assigned</Badge>
        ) : (
          <Badge variant="default">Unassigned</Badge>
        );
      }
    },
    {
      header: 'Assigned Students',
      key: 'assignedStudents',
      sortable: false,
      render: (_, row) => {
        const students = row.assignedStudents || row.members || [];
        if (!students.length && row.studentNames && row.studentNames.length) {
          return (
            <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
              {row.studentNames.map((name, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-900 font-bold text-xs"
                >
                  <User className="w-3 h-3 text-indigo-600" />
                  <span>{name}</span>
                </span>
              ))}
            </div>
          );
        }

        if (students.length > 0) {
          return (
            <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
              {students.map((student, idx) => (
                <span
                  key={student.id || idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-100/80 text-indigo-900 font-bold text-xs shadow-2xs"
                  title={`${student.name || 'Student'} (${student.email || 'No email'})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0"></span>
                  <span className="truncate max-w-[120px]">{student.name || student.email || `Student ${student.id}`}</span>
                </span>
              ))}
            </div>
          );
        }

        return (
          <span className="text-xs text-slate-400 font-medium italic flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-300" />
            No students assigned
          </span>
        );
      }
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
            onClick={() => handleOpenEdit(row)}
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
        <DataTable columns={columns} data={projects} searchPlaceholder="Search projects, groups, or students..." />
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
                type="button"
                onClick={() => setSelectedEdit(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveEdit}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-60"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Project Title</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="At Risk">At Risk</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Assigned Group & Students Context Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800">Assigned Team Details</span>
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedEdit.id;
                    setSelectedEdit(null);
                    navigateTo('instructor-project-details', { projectId: id });
                  }}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Manage Members <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Group:</span>
                <Badge variant="blue">{selectedEdit.group || selectedEdit.groupName || 'Unassigned'}</Badge>
              </div>

              <div>
                <span className="text-slate-500 font-medium block mb-1">
                  Enrolled Students ({selectedEdit.assignedStudents?.length || 0}):
                </span>
                {selectedEdit.assignedStudents && selectedEdit.assignedStudents.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEdit.assignedStudents.map((s, idx) => (
                      <span
                        key={s.id || idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold shadow-2xs"
                      >
                        <User className="w-3 h-3 text-indigo-600" />
                        <span>{s.name}</span>
                        {s.email && <span className="text-slate-400 font-normal">({s.email})</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic">No students assigned to this project.</span>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageProjectsPage;
