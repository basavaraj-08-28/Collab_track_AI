import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import ScoreCircle from '../../components/common/ScoreCircle';
import QualityRadarChart from '../../components/charts/QualityRadarChart';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { Users, Award, TrendingUp, Sparkles, MessageSquare, ArrowLeft, GraduationCap } from 'lucide-react';

export const StudentPerformancePage = () => {
  const { navigateTo } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorService.getStudents().then((data) => {
      setStudents(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        setSelectedStudent(data[0]);
      }
      setLoading(false);
    });
  }, []);

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

  const scoreVal = selectedStudent.collaborationScore || selectedStudent.score || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
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
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="primary">{selectedStudent.group || 'Enrolled Student'}</Badge>
              {selectedStudent.grade && <Badge variant="success">Grade: {selectedStudent.grade}</Badge>}
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {selectedStudent.name} - Performance Inspector
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Individual analytics and NLP communication radar generated for this student.
            </p>
          </div>

          {/* Student Switcher Dropdown */}
          {students.length > 1 && (
            <select
              value={selectedStudent.id}
              onChange={(e) => {
                const s = students.find((std) => String(std.id) === String(e.target.value));
                if (s) setSelectedStudent(s);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {students.map((std) => (
                <option key={std.id} value={std.id}>
                  {std.name} ({std.group || 'Student'})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
          <ScoreCircle
            score={scoreVal !== null ? scoreVal : 0}
            size={160}
            label={scoreVal !== null ? 'Collaboration Score' : 'No Score Yet'}
          />
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900">Student Profile & Overview</h3>
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
              <span className="text-slate-500 font-bold">Email Address:</span>
              <span className="font-bold text-slate-900">{selectedStudent.email || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
              <span className="text-slate-500 font-bold">Student ID:</span>
              <span className="font-bold text-slate-900">{selectedStudent.studentId || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
              <span className="text-slate-500 font-bold">Assigned Project:</span>
              <span className="font-bold text-slate-900">{selectedStudent.project || 'Unassigned'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformancePage;
