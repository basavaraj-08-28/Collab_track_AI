import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import ScoreCircle from '../../components/common/ScoreCircle';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { 
  Users, 
  Award, 
  TrendingUp, 
  Sparkles, 
  MessageSquare, 
  ArrowLeft, 
  GraduationCap, 
  CheckCircle2, 
  FileText, 
  Download, 
  ExternalLink, 
  Clock, 
  Calendar,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const StudentPerformancePage = () => {
  const { navigateTo } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Load students list
  useEffect(() => {
    instructorService.getStudents().then((data) => {
      const studentList = Array.isArray(data) ? data : [];
      setStudents(studentList);
      if (studentList.length > 0) {
        setSelectedStudent(studentList[0]);
      }
      setLoading(false);
    });
  }, []);

  // Whenever selectedStudent changes, load full performance and behavior history
  useEffect(() => {
    if (!selectedStudent?.id) return;
    setHistoryLoading(true);
    instructorService
      .getStudentPerformance(selectedStudent.id)
      .then((data) => {
        if (data) {
          setPerformanceData(data);
        } else {
          // Fallback if performance endpoint returns empty
          setPerformanceData({
            student: selectedStudent,
            score: selectedStudent.collaborationScore || selectedStudent.score || 0,
            breakdown: selectedStudent.breakdown || {},
            metrics: selectedStudent.metrics || {},
            tasks: [],
            discussions: [],
            activities: [],
            timeline: []
          });
        }
      })
      .catch(() => {
        setPerformanceData({
          student: selectedStudent,
          score: selectedStudent.collaborationScore || selectedStudent.score || 0,
          breakdown: {},
          metrics: {},
          tasks: [],
          discussions: [],
          activities: [],
          timeline: []
        });
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  }, [selectedStudent?.id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <SkeletonLoader count={3} height="h-32" />
      </div>
    );
  }

  if (!selectedStudent || students.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <button
          onClick={() => navigateTo('student-contributions')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Student Roster</span>
        </button>

        <EmptyState
          icon={GraduationCap}
          title="No Students Added"
          message="Add students to your project to begin tracking collaboration."
          actionLabel="Go to Student Roster"
          onAction={() => navigateTo('student-contributions')}
        />
      </div>
    );
  }

  const currentStudent = performanceData?.student || selectedStudent;
  const scoreVal =
    performanceData?.score !== undefined
      ? performanceData.score
      : (selectedStudent.collaborationScore !== undefined
          ? selectedStudent.collaborationScore
          : selectedStudent.score || 0);

  const getScoreRating = (score) => {
    if (score >= 85) return { label: 'Top Performer', variant: 'success', desc: 'Outstanding velocity, communication, and high-impact deliverable delivery.' };
    if (score >= 70) return { label: 'Strong Collaborator', variant: 'blue', desc: 'Consistent task contributions and proactive team communication.' };
    if (score >= 50) return { label: 'Steady Contributor', variant: 'warning', desc: 'Meeting baseline deliverables; room to increase participation velocity.' };
    if (score > 0) return { label: 'In Progress', variant: 'default', desc: 'Initial submissions logged; actively participating in team milestones.' };
    return { label: 'Awaiting Submissions', variant: 'default', desc: 'Tasks assigned; awaiting deliverable attachments or sprint activity.' };
  };

  const rating = getScoreRating(Number(scoreVal));

  const tasks = performanceData?.tasks || [];
  const discussions = performanceData?.discussions || [];
  const activities = performanceData?.activities || [];
  const timeline = performanceData?.timeline || [];

  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const deliverablesCount = tasks.filter((t) => t.submissionFile).length;

  const handleDownloadTaskFile = (taskId, fileName, e) => {
    if (e) e.stopPropagation();
    const link = document.createElement('a');
    link.href = `/api/instructor/tasks/${taskId}/file`;
    link.download = fileName || 'deliverable.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Navigation & Student Header */}
      <div>
        <button
          onClick={() => navigateTo('student-contributions')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Student Roster</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="blue">{currentStudent.group || 'Enrolled Student'}</Badge>
              {currentStudent.project && (
                <Badge variant="default">Project: {currentStudent.project}</Badge>
              )}
              {currentStudent.grade && currentStudent.grade !== 'N/A' && (
                <Badge variant="success">Grade: {currentStudent.grade}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentStudent.name} - Performance Inspector
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Authentic dynamic collaboration score, deliverable file reviews, and full student behavior history.
            </p>
          </div>

          {/* Student Switcher Dropdown */}
          {students.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Student:</span>
              <select
                value={selectedStudent.id}
                onChange={(e) => {
                  const s = students.find((std) => String(std.id) === String(e.target.value));
                  if (s) setSelectedStudent(s);
                }}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {students.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name} ({std.group || 'Student'})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Overview Grid: Score Circle + Profile & Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Circle Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <ScoreCircle
            score={scoreVal !== null ? Math.round(Number(scoreVal)) : 0}
            size={160}
            label="Collaboration Score"
          />
          <div className="space-y-1">
            <Badge variant={rating.variant}>{rating.label}</Badge>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1 leading-relaxed">
              {rating.desc}
            </p>
          </div>

          {/* Score Dimension Breakdown Pills */}
          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-left">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block">Deliverables (40%)</span>
              <span className="font-extrabold text-slate-800">
                {performanceData?.breakdown?.taskContribution ?? 0}%
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block">Participation (25%)</span>
              <span className="font-extrabold text-slate-800">
                {performanceData?.breakdown?.participationRate ?? 0}%
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block">Discussions (20%)</span>
              <span className="font-extrabold text-slate-800">
                {performanceData?.breakdown?.communicationSentiment ?? 0}%
              </span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-[10px] text-slate-400 font-bold block">Reliability (15%)</span>
              <span className="font-extrabold text-slate-800">
                {performanceData?.breakdown?.peerFeedback ?? 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Student Profile & Overview Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 mb-3">Student Profile & Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Email Address</span>
                <span className="font-bold text-slate-900 truncate block">{currentStudent.email || 'N/A'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Student ID</span>
                <span className="font-bold text-slate-900">{currentStudent.studentId || 'N/A'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Assigned Project</span>
                <span className="font-bold text-indigo-700">{currentStudent.project || 'Unassigned'}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">Group / Cohort</span>
                <span className="font-bold text-slate-900">{currentStudent.group || 'Default Team'}</span>
              </div>
            </div>
          </div>

          {/* Real Contributions Velocity Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Contribution Velocity & Output
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl">
                <span className="text-xl font-black text-indigo-700 block">
                  {completedTasks} / {tasks.length}
                </span>
                <span className="text-[10px] font-bold text-indigo-900">Tasks Completed</span>
              </div>
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl">
                <span className="text-xl font-black text-emerald-700 block">
                  {deliverablesCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-900">Files Submitted</span>
              </div>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-2xl">
                <span className="text-xl font-black text-blue-700 block">
                  {discussions.length}
                </span>
                <span className="text-[10px] font-bold text-blue-900">Messages Sent</span>
              </div>
              <div className="p-3 bg-purple-50/60 border border-purple-100 rounded-2xl">
                <span className="text-xl font-black text-purple-700 block">
                  {activities.length}
                </span>
                <span className="text-[10px] font-bold text-purple-900">Activities Logged</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Behavior & History Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Student Behavior & History Log
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect submitted deliverables, documents, discussion exchanges, and sprint participation actions.
            </p>
          </div>

          {/* History Category Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Activity ({timeline.length})
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tasks & Deliverables ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'discussions'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Discussions ({discussions.length})
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'activities'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Activity Logs ({activities.length})
            </button>
          </div>
        </div>

        {historyLoading ? (
          <SkeletonLoader count={3} height="h-20" />
        ) : (
          <div>
            {/* TAB: ALL COMBINED TIMELINE */}
            {activeTab === 'all' && (
              <div className="space-y-3">
                {timeline.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No activity recorded for this student yet.
                  </div>
                ) : (
                  timeline.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl hover:bg-slate-50 transition-all flex items-start gap-3.5"
                    >
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-indigo-600 shrink-0 shadow-2xs">
                        {item.category === 'task' ? (
                          item.file ? (
                            <FileCheck className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          )
                        ) : item.category === 'discussion' ? (
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-purple-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                            {item.timestamp || 'Recent'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Deliverable File Attachment Preview if present */}
                        {item.file && item.taskId && (
                          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl shadow-2xs">
                            <FileText className="w-4 h-4 text-rose-600" />
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                              {item.file}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadTaskFile(item.taskId, item.file, e)}
                              className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 flex items-center gap-1 transition-colors ml-2"
                              title="Download deliverable"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: TASKS & DELIVERABLES */}
            {activeTab === 'tasks' && (
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No tasks currently assigned to this student.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Project: {task.projectName}
                            </span>
                            <Badge
                              variant={
                                task.status === 'Completed'
                                  ? 'success'
                                  : task.status === 'In Progress'
                                  ? 'blue'
                                  : 'default'
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-900">{task.title}</h4>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                          )}
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          Due: {task.dueDate || 'No due date'}
                        </span>
                      </div>

                      {/* Submitted Deliverable Card */}
                      {task.submissionFile ? (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] shrink-0">
                              {task.submissionFile.split('.').pop()?.toUpperCase() || 'FILE'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-emerald-950 truncate">
                                {task.submissionFile}
                              </p>
                              <p className="text-[10px] text-emerald-700 font-medium">
                                Submitted {task.submittedAt || 'Deliverable attached'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleDownloadTaskFile(task.id, task.submissionFile, e)}
                            className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-300 flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-400 italic">
                          No deliverable file attached yet for this task.
                        </div>
                      )}

                      {/* Submission Notes */}
                      {task.submissionNotes && (
                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-100">
                          <span className="font-bold text-slate-800 block text-[10px] uppercase">
                            Submission Notes:
                          </span>
                          <p className="mt-0.5">{task.submissionNotes}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: DISCUSSIONS */}
            {activeTab === 'discussions' && (
              <div className="space-y-3">
                {discussions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No discussion messages posted by this student yet.
                  </div>
                ) : (
                  discussions.map((disc) => (
                    <div
                      key={disc.id}
                      className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-indigo-700 uppercase">
                          in {disc.projectName || 'Project Chat'}
                        </span>
                        <span>{disc.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium">
                        "{disc.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: ACTIVITY LOGS */}
            {activeTab === 'activities' && (
              <div className="space-y-2.5">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No recorded activity logs for this student.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                        <span className="font-bold text-slate-800">{act.type}</span>
                        <span className="text-slate-600">{act.description}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {act.scoreChange ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-lg">
                            +{act.scoreChange} pts
                          </span>
                        ) : null}
                        <span className="text-[10px] text-slate-400">{act.createdAt}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPerformancePage;
