import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import ScoreCircle from '../../components/common/ScoreCircle';
import ProgressBar from '../../components/common/ProgressBar';
import AIEvaluationSummary from '../../components/AI/AIEvaluationSummary';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { Award, Sparkles, Brain, AlertCircle } from 'lucide-react';

export const MyCollaborationScorePage = () => {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getScore();
      setScoreData(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve collaboration score.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-36" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load score" message={error} onRetry={fetchScore} />
      </div>
    );
  }

  const hasScore = scoreData && scoreData.overall !== undefined && scoreData.overall !== null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            My Collaboration Score & AI Evaluation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real algorithmic breakdown calculated from task contribution, participation, communication NLP, and peer feedback.
          </p>
        </div>
        {hasScore && scoreData.percentile && (
          <span className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl shrink-0">
            Rank: {scoreData.percentile}
          </span>
        )}
      </div>

      {!hasScore ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center ring-8 ring-indigo-50/50">
            <Award className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-extrabold text-slate-900">No Collaboration Score Yet</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your collaboration score will be generated after sufficient collaboration activity has been collected and analyzed.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={fetchScore}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Re-check Score
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Grid: Score Circle + Score Component Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Score Circle Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
              <ScoreCircle
                score={scoreData.overall}
                size={180}
                label={scoreData.label || 'Collaborator'}
                sublabel="Calculated by Collab Track AI"
              />
              <div className="mt-6 pt-6 border-t border-slate-100 w-full text-center">
                <p className="text-xs text-slate-500 font-medium">
                  Dynamic multi-vector metric based on real student contributions.
                </p>
              </div>
            </div>

            {/* Component Sliders */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Score Component Breakdown</h3>

              <div className="space-y-5">
                {(scoreData.components || []).map((comp, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{comp.name}</span>
                      <div className="flex items-center gap-2">
                        {comp.weight && (
                          <span className="text-[10px] text-slate-400 font-semibold">Weight: {comp.weight}</span>
                        )}
                        <span className="font-extrabold text-indigo-600">{comp.score} / 100</span>
                      </div>
                    </div>
                    <ProgressBar value={comp.score} showValue={false} height="h-3" color="bg-indigo-600" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Assessment Narrative Section */}
          <AIEvaluationSummary
            score={scoreData.overall}
            narrative={scoreData.aiAssessment}
            strengths={scoreData.strengths || []}
            improvements={scoreData.improvements || []}
          />
        </>
      )}
    </div>
  );
};

export default MyCollaborationScorePage;
