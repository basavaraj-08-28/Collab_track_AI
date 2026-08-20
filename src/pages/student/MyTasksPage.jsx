import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { CheckSquare, Calendar, Clock, Sparkles, Send, Eye, FileText } from 'lucide-react';

export const MyTasksPage = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getTasks(filter);
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve assigned tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await studentService.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      addToast(`Task status updated to "${newStatus}". Real activity recorded!`, 'success');
    } catch (err) {
      addToast('Failed to update task status.', 'error');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setIsSubmitting(true);
    try {
      await studentService.submitTask(selectedTask.id, submissionNotes);
      setTasks((prev) =>
        prev.map((t) => (t.id === selectedTask.id ? { ...t, status: 'Completed' } : t))
      );
      addToast(`Task "${selectedTask.title}" submitted successfully!`, 'success');
      setSelectedTask(null);
      setSubmissionNotes('');
    } catch (err) {
      addToast('Task submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader type="cards" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load your tasks" message={error} onRetry={fetchTasks} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            My Assigned Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real sprint task deliverables assigned to your student profile.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-semibold overflow-x-auto">
          {['All', 'Pending', 'In Progress', 'Completed', 'Overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === status ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No Tasks Assigned"
          message="You currently have no assigned tasks."
          actionLabel="Check for New Tasks"
          onAction={fetchTasks}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {task.project || 'Assigned Project'}
                  </span>
                  <Badge
                    variant={
                      task.priority === 'High'
                        ? 'danger'
                        : task.priority === 'Medium'
                        ? 'warning'
                        : 'default'
                    }
                  >
                    {task.priority || 'Normal'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{task.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {task.description || 'No description available for this task.'}
                </p>

                {task.tags && task.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {task.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 mb-4">
                  {task.assignedDate && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <FileText className="w-3.5 h-3.5" /> Assigned:
                      </span>
                      <span className="font-bold text-slate-800">{task.assignedDate}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3.5 h-3.5" /> Deadline:
                      </span>
                      <span className="font-bold text-slate-800">{task.dueDate}</span>
                    </div>
                  )}
                  {task.aiEffortEstimate && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" /> AI Effort:
                      </span>
                      <span className="font-bold text-indigo-700">{task.aiEffortEstimate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Status</span>
                  <select
                    value={task.status || 'Pending'}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="In Review">In Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTask(task)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View / Submit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Submission / View Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task: ${selectedTask.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Project: {selectedTask.project}</span>
              <p className="text-slate-700 leading-relaxed">{selectedTask.description || 'No detailed instructions.'}</p>
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Submission Deliverable & Notes
                </label>
                <textarea
                  rows={4}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Paste repository links, deliverable summaries, or implementation notes..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyTasksPage;
