import React, { useState, useEffect, useRef } from 'react';
import { studentService } from '../../services/studentService';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  Sparkles, 
  Send, 
  Eye, 
  FileText, 
  Upload, 
  UploadCloud, 
  Paperclip, 
  X, 
  CheckCircle2, 
  File, 
  AlertCircle,
  Award
} from 'lucide-react';

export const MyTasksPage = () => {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');
  
  // Submission modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleOpenSubmitModal = (task) => {
    setSelectedTask(task);
    setSubmissionNotes(task.submissionNotes || '');
    setAttachedFile(task.submissionFile ? { name: task.submissionFile, isExisting: true } : null);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setSubmissionNotes('');
    setAttachedFile(null);
    setIsDragging(false);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await studentService.updateTaskStatus(taskId, newStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      addToast(`Task status updated to "${newStatus}".`, 'success');
    } catch (err) {
      addToast('Failed to update task status.', 'error');
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Check size limit: 25MB
    const maxSize = 25 * 1024 * 1024;
    if (file.size > maxSize) {
      addToast('File size exceeds the 25MB limit.', 'error');
      return;
    }

    // Supported formats check: PDF, Word docs, text, slides, archives
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.zip', '.odt', '.rtf'];
    const fileName = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

    if (!isAllowed) {
      addToast('Please upload a valid document or PDF format (.pdf, .doc, .docx, .txt, etc.)', 'warning');
      return;
    }

    setAttachedFile(file);
    addToast(`Attached document: "${file.name}"`, 'info');
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIconBadge = (fileName = '') => {
    const name = fileName.toLowerCase();
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

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!submissionNotes.trim() && !attachedFile) {
      addToast('Please upload a document/PDF deliverable or enter submission notes.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileName = attachedFile ? attachedFile.name : null;
      await studentService.submitTask(selectedTask.id, submissionNotes.trim(), fileName);
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === selectedTask.id
            ? {
                ...t,
                status: 'Completed',
                submissionFile: fileName,
                submissionNotes: submissionNotes.trim(),
                submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
              }
            : t
        )
      );

      addToast(`Task "${selectedTask.title}" submitted successfully! +5 score recorded.`, 'success');
      handleCloseModal();
    } catch (err) {
      addToast(err.message || 'Task submission failed.', 'error');
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
            Real sprint task deliverables assigned to your student profile with document/PDF submission support.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 text-xs font-semibold overflow-x-auto">
          {['All', 'Pending', 'In Progress', 'Completed', 'Overdue'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === status
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
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
          message="You currently have no assigned tasks in this filter view."
          actionLabel="Refresh Tasks"
          onAction={fetchTasks}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => {
            const fileBadgeInfo = task.submissionFile ? getFileIconBadge(task.submissionFile) : null;
            const isCompleted = task.status === 'Completed';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                  isCompleted 
                    ? 'border-emerald-200/80 shadow-xs bg-linear-to-b from-emerald-50/20 to-white' 
                    : 'border-slate-200/80 shadow-xs hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {task.project || task.projectName || 'Assigned Project'}
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

                  {/* Task Meta Info */}
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
                    {task.scoreImpact && (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Award className="w-3.5 h-3.5 text-indigo-600" /> Score Impact:
                        </span>
                        <span className="font-bold text-indigo-700">+{task.scoreImpact} pts</span>
                      </div>
                    )}
                  </div>

                  {/* Submitted Document Preview Banner if task already has an attached file */}
                  {task.submissionFile && (
                    <div className={`mb-4 p-3 rounded-2xl border flex items-center justify-between gap-2 ${fileBadgeInfo?.bg || 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl ${fileBadgeInfo?.badgeColor || 'bg-indigo-600'} text-white flex items-center justify-center font-black text-[10px] shrink-0 shadow-xs`}>
                          {fileBadgeInfo?.label || 'DOC'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate text-slate-900">{task.submissionFile}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Deliverable submitted
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                      onClick={() => handleOpenSubmitModal(task)}
                      className={`flex-1 py-2 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        isCompleted
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>View / Re-upload</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload File & Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Submission & Document/PDF Upload Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={handleCloseModal}
          title={`Submit Deliverable: ${selectedTask.title}`}
        >
          <div className="space-y-4 text-xs">
            {/* Task Context Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                  Project: {selectedTask.project || selectedTask.projectName || 'Active Project'}
                </span>
                <Badge variant={selectedTask.status === 'Completed' ? 'success' : 'default'}>
                  {selectedTask.status}
                </Badge>
              </div>
              <p className="text-slate-700 font-medium leading-relaxed">
                {selectedTask.description || 'Complete the assigned task deliverable and attach the document/PDF file below.'}
              </p>
            </div>

            <form onSubmit={handleTaskSubmit} className="space-y-4">
              {/* Document / PDF Upload Section */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Attach Document / PDF Deliverable
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">PDF, DOCX, DOC, TXT (Max 25MB)</span>
                </label>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.zip,.odt,.rtf"
                  className="hidden"
                />

                {attachedFile ? (
                  /* File Attached Preview Card */
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        {attachedFile.name.split('.').pop()?.toUpperCase() || 'DOC'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-indigo-950 truncate">{attachedFile.name}</p>
                        <p className="text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
                          {attachedFile.size ? formatFileSize(attachedFile.size) : 'Ready for submission'}
                          {attachedFile.isExisting && ' • Currently Submitted'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Drag and Drop Upload Area */
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload or drag & drop deliverable
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Document or PDF format (.pdf, .docx, .doc, .txt)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Browse Files</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Submission Notes & Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Deliverable Notes & Summary</span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Paste repository links, deliverable highlights, or implementation comments..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span>Submitting Deliverable...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{attachedFile ? 'Submit with File' : 'Submit Task'}</span>
                    </>
                  )}
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

