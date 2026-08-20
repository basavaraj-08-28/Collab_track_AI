import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Users, CheckSquare, PlusCircle, Edit, Trash2, UserCheck, Calendar, FolderKanban } from 'lucide-react';

export const InstructorProjectDetailsPage = () => {
  const { selectedProjectId, navigateTo } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskModalData, setTaskModalData] = useState({
    id: null,
    title: '',
    description: '',
    priority: 'Medium',
    dueDate: '',
    status: 'Pending',
    assignedTo: ''
  });

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTaskForAssign, setSelectedTaskForAssign] = useState(null);
  const [assignStudentId, setAssignStudentId] = useState('');

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!selectedProjectId) {
        setProject(null);
        setLoading(false);
        return;
      }
      const data = await instructorService.getProjectById(selectedProjectId);
      setProject(data);

      if (data) {
        const [taskList, memberList] = await Promise.all([
          instructorService.getProjectTasks(selectedProjectId),
          instructorService.getProjectMembers(selectedProjectId)
        ]);
        setTasks(Array.isArray(taskList) ? taskList : []);
        setMembers(Array.isArray(memberList) ? memberList : []);
      }
    } catch (err) {
      setError(err.message || 'Unable to retrieve project details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [selectedProjectId]);

  const handleOpenCreateTask = () => {
    setTaskModalData({
      id: null,
      title: '',
      description: '',
      priority: 'Medium',
      dueDate: '',
      status: 'Pending',
      assignedTo: ''
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task) => {
    setTaskModalData({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate || '',
      status: task.status || 'Pending',
      assignedTo: task.assignedTo ? String(task.assignedTo) : ''
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskModalData.title.trim()) {
      addToast('Task title is required.', 'error');
      return;
    }

    try {
      if (taskModalData.id) {
        await instructorService.updateTask(taskModalData.id, taskModalData);
        addToast(`Task "${taskModalData.title}" updated successfully!`, 'success');
      } else {
        await instructorService.createProjectTask(project.id, taskModalData);
        addToast(`Task "${taskModalData.title}" created successfully!`, 'success');
      }
      setShowTaskModal(false);
      const updatedTasks = await instructorService.getProjectTasks(project.id);
      setTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
    } catch (err) {
      addToast(err.message || 'Failed to save task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId, title) => {
    try {
      await instructorService.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      addToast(`Task "${title}" deleted successfully.`, 'success');
    } catch (err) {
      addToast(err.message || 'Failed to delete task.', 'error');
    }
  };

  const handleOpenAssignModal = (task) => {
    setSelectedTaskForAssign(task);
    setAssignStudentId(task.assignedTo ? String(task.assignedTo) : '');
    setShowAssignModal(true);
  };

  const handleAssignTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTaskForAssign || !assignStudentId) {
      addToast('Please select a student to assign.', 'error');
      return;
    }

    try {
      const res = await instructorService.assignTask(selectedTaskForAssign.id, assignStudentId);
      addToast(res.message || 'Task assigned successfully.', 'success');
      setShowAssignModal(false);
      const updatedTasks = await instructorService.getProjectTasks(project.id);
      setTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
    } catch (err) {
      addToast(err.message || 'Failed to assign task.', 'error');
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
        <ErrorState title="Unable to load project details" message={error} onRetry={fetchProjectData} />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <button
          onClick={() => navigateTo('manage-projects')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Manage Projects</span>
        </button>

        <EmptyState
          icon={FolderKanban}
          title="No Project Selected"
          message="Please select a course project from the Manage Projects page."
          actionLabel="Go to Projects"
          onAction={() => navigateTo('manage-projects')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <button
          onClick={() => navigateTo('manage-projects')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Manage Projects</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {project.code && <Badge variant="primary">{project.code}</Badge>}
              {project.group && <Badge variant="blue">{project.group}</Badge>}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{project.name}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{project.description || 'No description available.'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Group Score</span>
          <h3 className="text-3xl font-black text-indigo-600">
            {project.collaborationScore ? `${project.collaborationScore} / 100` : 'Pending'}
          </h3>
          <p className="text-xs text-slate-500">Calculated via AI matrix</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Deliverables</span>
          <h3 className="text-3xl font-black text-slate-900">
            {tasks.filter((t) => t.status === 'Completed').length} / {tasks.length}
          </h3>
          <ProgressBar value={tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === 'Completed').length / tasks.length) * 100) : 0} showValue={false} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Project Deadline</span>
          <h3 className="text-xl font-black text-slate-800">{project.deadline || 'End of Semester'}</h3>
          <p className="text-xs text-slate-500">Scheduled milestone target</p>
        </div>
      </div>

      {/* Enrolled Members Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Enrolled Members ({members.length})
        </h3>

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Students Enrolled"
            message="Assign students to this project from Manage Students page to allow task assignment."
            actionLabel="Go to Manage Students"
            onAction={() => navigateTo('student-contributions')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.name} size="md" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                    <p className="text-[10px] text-slate-500">{member.email} • {member.studentId || 'N/A'}</p>
                  </div>
                </div>
                <Badge variant="success">Enrolled Member</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Tasks Management Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              Project Tasks & Assignments ({tasks.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tasks created for this project can only be assigned to enrolled project members.
            </p>
          </div>

          <button
            onClick={handleOpenCreateTask}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No Tasks Created"
            message="Create project tasks and assign them to enrolled students."
            actionLabel="Create First Task"
            onAction={handleOpenCreateTask}
          />
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                  <th className="pb-3 pr-4">Task Title</th>
                  <th className="pb-3 pr-4">Priority</th>
                  <th className="pb-3 pr-4">Deadline</th>
                  <th className="pb-3 pr-4">Assigned Student</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-bold text-slate-900 block">{t.title}</span>
                      {t.description && (
                        <span className="text-[11px] text-slate-500 line-clamp-1">{t.description}</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'default'}>
                        {t.priority || 'Medium'}
                      </Badge>
                    </td>
                    <td className="py-3.5 pr-4 font-mono text-[11px] text-slate-600">
                      {t.dueDate || 'No Deadline'}
                    </td>
                    <td className="py-3.5 pr-4">
                      {t.assignedToName ? (
                        <Badge variant="blue">{t.assignedToName}</Badge>
                      ) : (
                        <span className="text-slate-400 font-semibold text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={t.status === 'Completed' ? 'success' : t.status === 'In Progress' ? 'warning' : 'default'}>
                        {t.status || 'Pending'}
                      </Badge>
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenAssignModal(t)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Assign to Student"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign</span>
                      </button>
                      <button
                        onClick={() => handleOpenEditTask(t)}
                        className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors inline-block"
                        title="Edit Task"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(t.id, t.title)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Task Modal */}
      {showTaskModal && (
        <Modal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          title={taskModalData.id ? 'Edit Project Task' : 'Create Project Task'}
        >
          <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Task Title *</label>
              <input
                type="text"
                placeholder="e.g. Dataset Collection & Preprocessing"
                value={taskModalData.title}
                onChange={(e) => setTaskModalData({ ...taskModalData, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Enter detailed task instructions or expected deliverables..."
                value={taskModalData.description}
                onChange={(e) => setTaskModalData({ ...taskModalData, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Priority</label>
                <select
                  value={taskModalData.priority}
                  onChange={(e) => setTaskModalData({ ...taskModalData, priority: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={taskModalData.status}
                  onChange={(e) => setTaskModalData({ ...taskModalData, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={taskModalData.dueDate}
                  onChange={(e) => setTaskModalData({ ...taskModalData, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign To Project Member</label>
                <select
                  value={taskModalData.assignedTo}
                  onChange={(e) => setTaskModalData({ ...taskModalData, assignedTo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                {taskModalData.id ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && selectedTaskForAssign && (
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`Assign Task: ${selectedTaskForAssign.title}`}
        >
          <form onSubmit={handleAssignTaskSubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Task Details</span>
              <p className="font-bold text-slate-900">{selectedTaskForAssign.title}</p>
              <p className="text-slate-600 text-[11px]">{selectedTaskForAssign.description || 'No description provided.'}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Project Student *</label>
              <select
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="">Select Student</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Only students enrolled in {project.name} are shown.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Assign Task
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InstructorProjectDetailsPage;
