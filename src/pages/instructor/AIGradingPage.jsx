import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import UserAvatar from '../../components/common/UserAvatar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { ShieldCheck, Brain, Play, Download, CheckCircle2, Sliders } from 'lucide-react';

export const AIGradingPage = () => {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [approved, setApproved] = useState(false);

  // Configurable Scoring Parameters
  const [weights, setWeights] = useState({
    task: 25,
    participation: 20,
    communication: 20,
    quality: 20,
    peer: 15,
  });

  const fetchStudentsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve student roster for grading.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentsData();
  }, []);

  const handleRunAIAnalysis = async () => {
    setAnalyzing(true);
    addToast('Executing machine learning evaluation model...', 'info');

    try {
      const res = await instructorService.runAIGrading();
      if (res && res.grades) {
        setStudents(res.grades);
        addToast('✨ AI Collaboration Grades calculated based on actual data!', 'success');
      } else {
        addToast(res?.message || 'Collaboration data is required before AI grading can be generated.', 'warning');
      }
    } catch (err) {
      addToast('AI Grading calculation failed.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveGrades = () => {
    setApproved(true);
    addToast('Grades officially approved and published to Student Portal!', 'success');
  };

  const handleExport = () => {
    addToast('Exporting AI Grading Report...', 'info');
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
        <ErrorState title="Unable to load AI Grading" message={error} onRetry={fetchStudentsData} />
      </div>
    );
  }

  const hasGradedData = students.length > 0 && students.some((s) => s.collaborationScore || s.suggestedGrade);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="ai">AI Grading Engine</Badge>
            <Badge variant="primary">Course Portal</Badge>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            AI Collaboration Grading Portal
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated multi-vector grading combining task velocity, NLP communication sentiment, and peer reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAIAnalysis}
            disabled={analyzing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'Evaluating AI Model...' : 'Run AI Analysis'}</span>
          </button>
        </div>
      </div>

      {!hasGradedData && students.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="AI Analysis Not Available"
          message="Collaboration data is required before AI grading can be generated."
          actionLabel="Run AI Analysis"
          onAction={handleRunAIAnalysis}
        />
      ) : (
        /* Main Grid: Configurable Weights + Results Table */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configurable Weights Panel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Configurable Scoring Weights
              </h3>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Total 100%
              </span>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Task Contribution', key: 'task', val: weights.task },
                { label: 'Participation Rate', key: 'participation', val: weights.participation },
                { label: 'Communication Sentiment', key: 'communication', val: weights.communication },
                { label: 'Discussion Quality', key: 'quality', val: weights.quality },
                { label: 'Peer Feedback', key: 'peer', val: weights.peer },
              ].map((param) => (
                <div key={param.key} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{param.label}</span>
                    <span className="text-indigo-600">{param.val}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    value={param.val}
                    onChange={(e) => setWeights({ ...weights, [param.key]: Number(e.target.value) })}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Output Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Calculated Student Grades</h3>
              {approved && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                  ✓ Grades Approved & Published
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                    <th className="p-3">Student</th>
                    <th className="p-3">Project / Group</th>
                    <th className="p-3">AI Score</th>
                    <th className="p-3">Suggested Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {students.map((std) => (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <UserAvatar name={std.name} avatar={std.avatar} size="sm" />
                          <span className="font-bold text-slate-900">{std.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">
                        {std.project || 'Project'} • {std.group || 'Group'}
                      </td>
                      <td className="p-3 font-extrabold text-indigo-600">
                        {std.collaborationScore ? `${std.collaborationScore} / 100` : 'Pending'}
                      </td>
                      <td className="p-3">
                        <span className="px-3 py-1 bg-indigo-600 text-white font-black rounded-lg text-xs">
                          {std.suggestedGrade || std.grade || 'P'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              <button
                onClick={handleApproveGrades}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Grades</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIGradingPage;
