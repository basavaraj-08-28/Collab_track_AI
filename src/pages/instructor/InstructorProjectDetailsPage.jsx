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
import { 
  ArrowLeft, 
  Users, 
  CheckSquare, 
  PlusCircle, 
  Edit, 
  Trash2, 
  UserCheck, 
  Calendar, 
  FolderKanban,
  FileText,
  Download,
  ExternalLink,
  Eye,
  CheckCircle2,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export const InstructorProjectDetailsPage = () => {
  const { selectedProjectId, navigateTo } = useAuth();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
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

  // Enroll Student Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);

  // Student Submission Inspection Modal State
  const [selectedSubmissionTask, setSelectedSubmissionTask] = useState(null);

  const getFileBadgeInfo = (fileName = '') => {
    const name = (fileName || '').toLowerCase();
    if (name.endsWith('.pdf')) {
      return { label: 'PDF', bg: 'bg-rose-50 border-rose-200 text-rose-700', badgeColor: 'bg-rose-600' };
    }
    if (name.endsWith('.doc') || name.endsWith('.docx')) {
      return { label: 'DOC', bg: 'bg-blue-50 border-blue-200 text-blue-700', badgeColor: 'bg-blue-600' };
    }
    if (name.endsWith('.ppt') || name.endsWith('.pptx')) {
      return { label: 'PPT', bg: 'bg-orange-50 border-orange-200 text-orange-700', badgeColor: 'bg-orange-600' };
    }
    if (name.endsWith('.zip')) {
      return { label: 'ZIP', bg: 'bg-amber-50 border-amber-200 text-amber-700', badgeColor: 'bg-amber-600' };
    }
    return { label: 'DOC', bg: 'bg-indigo-50 border-indigo-200 text-indigo-700', badgeColor: 'bg-indigo-600' };
  };

  const handleOpenSubmissionFile = (task, e) => {
    if (e) e.stopPropagation();
    if (!task) return;
    if (task.submissionFileData && task.submissionFileData.startsWith('data:')) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${task.submissionFileData}" frameborder="0" style="border:0; position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
        );
        win.document.title = task.submissionFile || 'Student Submission PDF';
        return;
      }
    }
    window.open(`/api/instructor/tasks/${task.id}/file`, '_blank');
  };

  const handleDownloadSubmissionFile = (task, e) => {
    if (e) e.stopPropagation();
    if (!task) return;
    if (task.submissionFileData && task.submissionFileData.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = task.submissionFileData;
      a.download = task.submissionFile || 'student_deliverable.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const a = document.createElement('a');
    a.href = `/api/instructor/tasks/${task.id}/file`;
    a.download = task.submissionFile || 'student_deliverable.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
        const [taskList, memberList, studentList] = await Promise.all([
          instructorService.getProjectTasks(selectedProjectId),
          instructorService.getProjectMembers(selectedProjectId),
          instructorService.getStudents()
        ]);
        setTasks(Array.isArray(taskList) ? taskList : []);
        setMembers(Array.isArray(memberList) ? memberList : []);
        setAllStudents(Array.isArray(studentList) ? studentList : []);
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

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollStudentId) {
      addToast('Please select a student to enroll.', 'error');
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await instructorService.assignProject(enrollStudentId, project.id);
      addToast(res.message || 'Student enrolled in project successfully!', 'success');
      setShowEnrollModal(false);
      setEnrollStudentId('');
      // Refetch project members & tasks
      const [updatedMembers, updatedTasks] = await Promise.all([
        instructorService.getProjectMembers(project.id),
        instructorService.getProjectTasks(project.id)
      ]);
      setMembers(Array.isArray(updatedMembers) ? updatedMembers : []);
      setTasks(Array.isArray(updatedTasks) ? updatedTasks : []);
    } catch (err) {
      addToast(err.message || 'Failed to enroll student.', 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Enrolled Members ({members.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Students enrolled in this project will see it in their student dashboard and discussions.</p>
          </div>
          <button
            onClick={() => setShowEnrollModal(true)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Enroll Student</span>
          </button>
        </div>

        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No Students Enrolled"
            message="Enroll registered students directly to this project so they can view it in their dashboard."
            actionLabel="Enroll First Student"
            onAction={() => setShowEnrollModal(true)}
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
                  <th className="pb-3 pr-4">Submitted Deliverable</th>
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
                    <td className="py-3.5 pr-4">
                      {t.submissionFile ? (
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionTask(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-left transition-all hover:shadow-xs group max-w-[210px] bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                            title="Inspect Student Submission & View PDF"
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black shrink-0 ${getFileBadgeInfo(t.submissionFile).badgeColor} text-white shadow-xs`}>
                              {getFileBadgeInfo(t.submissionFile).label}
                            </span>
                            <span className="font-bold text-slate-800 text-[11px] truncate group-hover:text-indigo-600">
                              {t.submissionFile}
                            </span>
                            <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 ml-auto shrink-0" />
                          </button>
                          {t.submittedAt && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {t.submittedAt}
                            </span>
                          )}
                        </div>
                      ) : t.submissionNotes ? (
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmissionTask(t)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[11px] font-medium transition-colors max-w-[190px]"
                            title="View Deliverable Notes"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{t.submissionNotes}</span>
                          </button>
                          {t.submittedAt && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {t.submittedAt}
                            </span>
                          )}
                        </div>
                      ) : t.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium text-[11px] italic">
                          No submission yet
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {(t.submissionFile || t.submissionNotes) && (
                        <button
                          onClick={() => setSelectedSubmissionTask(t)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                          title="Inspect Student Deliverable / PDF"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      )}
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
                <label className="block font-bold text-slate-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={taskModalData.dueDate}
                  onChange={(e) => setTaskModalData({ ...taskModalData, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assign To Student</label>
                <select
                  value={taskModalData.assignedTo}
                  onChange={(e) => setTaskModalData({ ...taskModalData, assignedTo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="">Unassigned</option>
                  {(allStudents.length > 0 ? allStudents : members).map((m) => {
                    const isEnrolled = members.some((mem) => mem.id === m.id);
                    return (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.email}){isEnrolled ? ' • Enrolled' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Assigning a task will automatically enroll the student into this project.
                </p>
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
              <label className="block font-bold text-slate-700 mb-1">Select Student to Assign *</label>
              <select
                value={assignStudentId}
                onChange={(e) => setAssignStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="">Select Student</option>
                {(allStudents.length > 0 ? allStudents : members).map((m) => {
                  const isEnrolled = members.some((mem) => mem.id === m.id);
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email}){isEnrolled ? ' • Enrolled' : ''}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Assigning a student will automatically add them to this project's enrolled members list.
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

      {/* Enroll Student Directly to Project Modal */}
      {showEnrollModal && (
        <Modal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          title={`Enroll Student to ${project.name}`}
        >
          <form onSubmit={handleEnrollStudent} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Student to Enroll *</label>
              <select
                value={enrollStudentId}
                onChange={(e) => setEnrollStudentId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                required
              >
                <option value="">Choose a student...</option>
                {allStudents
                  .filter((s) => !members.some((m) => m.id === s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email}) {s.studentId ? `• ID: ${s.studentId}` : ''}
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Once enrolled, this project will appear in the student's dashboard, projects list, and discussion boards.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isEnrolling}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs disabled:opacity-60"
              >
                {isEnrolling ? 'Enrolling...' : 'Enroll in Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Submission & PDF Viewer Modal */}
      {selectedSubmissionTask && (
        <Modal
          isOpen={!!selectedSubmissionTask}
          onClose={() => setSelectedSubmissionTask(null)}
          title={`Student Submission: ${selectedSubmissionTask.title}`}
        >
          <div className="space-y-4 text-xs">
            {/* Student Meta Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-3">
                <UserAvatar name={selectedSubmissionTask.assignedToName || 'Student'} size="md" />
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    {selectedSubmissionTask.assignedToName || 'Enrolled Student'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {selectedSubmissionTask.assignedToEmail || 'Student'} • Project: {project?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Badge variant={selectedSubmissionTask.status === 'Completed' ? 'success' : 'default'}>
                  {selectedSubmissionTask.status}
                </Badge>
                {selectedSubmissionTask.submittedAt && (
                  <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {selectedSubmissionTask.submittedAt}
                  </span>
                )}
              </div>
            </div>

            {/* Original Task Requirements */}
            {selectedSubmissionTask.description && (
              <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Task Requirements</span>
                <p className="text-slate-700 leading-relaxed">{selectedSubmissionTask.description}</p>
              </div>
            )}

            {/* Submitted File Deliverable */}
            {selectedSubmissionTask.submissionFile ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${getFileBadgeInfo(selectedSubmissionTask.submissionFile).badgeColor} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs`}>
                      {getFileBadgeInfo(selectedSubmissionTask.submissionFile).label}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {selectedSubmissionTask.submissionFile}
                      </p>
                      <p className="text-[10px] text-indigo-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Submitted Student Deliverable Document
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleOpenSubmissionFile(selectedSubmissionTask, e)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in New Tab</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDownloadSubmissionFile(selectedSubmissionTask, e)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* PDF In-page Embedded Preview if file is PDF */}
                {selectedSubmissionTask.submissionFile.toLowerCase().endsWith('.pdf') && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-rose-600" /> PDF Document Preview
                      </span>
                      <span className="text-[10px] text-slate-400">Interactive Document Viewer</span>
                    </div>
                    <div className="w-full h-80 sm:h-96 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 shadow-inner">
                      <iframe
                        src={selectedSubmissionTask.submissionFileData || `/api/instructor/tasks/${selectedSubmissionTask.id}/file`}
                        title={selectedSubmissionTask.submissionFile}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No file attachment was uploaded for this task.</span>
              </div>
            )}

            {/* Submission Notes & Comments */}
            {selectedSubmissionTask.submissionNotes && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Student Deliverable Notes
                </span>
                <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {selectedSubmissionTask.submissionNotes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSubmissionTask(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default InstructorProjectDetailsPage;
