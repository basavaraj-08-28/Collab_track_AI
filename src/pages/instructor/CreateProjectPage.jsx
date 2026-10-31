import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import { useToast } from '../../context/ToastContext';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import {
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Users,
  Search,
  CheckSquare,
  Square,
  UserCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export const CreateProjectPage = () => {
  const { navigateTo } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    groupName: '',
    description: '',
    totalTasks: 10,
    deadline: '',
    studentIds: [],
    taskWeight: 25,
    participationWeight: 20,
    communicationWeight: 20,
    qualityWeight: 20,
    peerWeight: 15,
  });

  const [students, setStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const data = await instructorService.getStudents();
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, []);

  const toggleStudent = (id) => {
    setFormData((prev) => {
      const exists = prev.studentIds.includes(id);
      return {
        ...prev,
        studentIds: exists
          ? prev.studentIds.filter((sId) => sId !== id)
          : [...prev.studentIds, id]
      };
    });
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredStudents.map((s) => s.id);
    setFormData((prev) => ({
      ...prev,
      studentIds: Array.from(new Set([...prev.studentIds, ...filteredIds]))
    }));
  };

  const clearAllSelected = () => {
    setFormData((prev) => ({
      ...prev,
      studentIds: []
    }));
  };

  const filteredStudents = students.filter((s) =>
    (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
    (s.studentId || '').toLowerCase().includes(studentSearch.toLowerCase())
  );

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      addToast('Project Name is required.', 'error');
      setStep(1);
      return;
    }

    try {
      await instructorService.createProject(formData);
      addToast(
        `Project "${formData.name}" created successfully with ${formData.studentIds.length} enrolled student(s)!`,
        'success'
      );
      navigateTo('manage-projects');
    } catch (err) {
      addToast(err.message || 'Failed to create project.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => navigateTo('manage-projects')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-indigo-600" />
          Create New Group Project
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure project parameters, assign student members, and set deliverable targets.
        </p>
      </div>

      {/* Wizard Steps Navigation */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
        {[
          { num: 1, label: 'General Info' },
          { num: 2, label: 'Students & Schedule' },
          { num: 3, label: 'Finalize & Publish' },
        ].map((s) => (
          <div
            key={s.num}
            className={`py-2 text-center rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              step === s.num
                ? 'bg-indigo-600 text-white shadow-xs'
                : step > s.num
                ? 'text-indigo-700 bg-indigo-50'
                : ''
            }`}
          >
            <span>Step {s.num}: {s.label}</span>
          </div>
        ))}
      </div>

      {/* Step Content Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Project General Information</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                placeholder="e.g. Smart Campus IoT Portal"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g. CS401-ALPHA"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Team Alpha"
                  value={formData.groupName}
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project Objective & Description</label>
              <textarea
                rows={3}
                placeholder="Enter project summary and technical deliverables..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Students & Schedule</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign students directly to this project. Selected students will see this project in their student dashboard and discussions immediately.
              </p>
            </div>

            {/* Timeline & Sprint Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Project Deadline
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Planned Sprint Tasks Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.totalTasks}
                  onChange={(e) => setFormData({ ...formData, totalTasks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Student Assignment Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Assign Students to Project
                  </h4>
                  <Badge variant={formData.studentIds.length > 0 ? 'blue' : 'default'}>
                    {formData.studentIds.length} Selected
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectAllFiltered}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Select All ({filteredStudents.length})
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={clearAllSelected}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Student Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students by name, email, or student ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              {/* Student List */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                {isLoadingStudents ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading student roster...</div>
                ) : filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    {studentSearch ? 'No students match your search filter.' : 'No registered students found.'}
                  </div>
                ) : (
                  filteredStudents.map((std) => {
                    const isSelected = formData.studentIds.includes(std.id);
                    return (
                      <div
                        key={std.id}
                        onClick={() => toggleStudent(std.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="text-indigo-600 focus:outline-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStudent(std.id);
                            }}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                          <UserAvatar name={std.name} avatar={std.avatar} size="sm" />
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{std.name}</span>
                              {std.studentId && (
                                <span className="font-mono text-[10px] text-slate-400 font-normal">
                                  ({std.studentId})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500">{std.email}</div>
                          </div>
                        </div>

                        {isSelected ? (
                          <Badge variant="blue">Enrolled</Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Click to assign</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Tip: You can also enroll additional students later from the Project Details page or automatically assign them when creating tasks.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center py-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-900">Ready to Publish Project</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Review your project configuration before publishing. Enrolled students will immediately see this project on their dashboard.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Project Name</span>
                  <span className="font-bold text-slate-900 text-sm">{formData.name || 'Untitled Project'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Course Code</span>
                  <span className="font-mono font-bold text-indigo-600">{formData.code || 'Auto-generated'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Initial Group</span>
                  <span className="font-semibold text-slate-800">{formData.groupName || 'Default Group'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Deadline</span>
                  <span className="font-semibold text-slate-800">{formData.deadline || 'No deadline specified'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Enrolled Students ({formData.studentIds.length})
                </span>
                {formData.studentIds.length === 0 ? (
                  <p className="text-slate-400 italic">No students assigned yet. You can assign students after creation.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.studentIds.map((id) => {
                      const studentObj = students.find((s) => s.id === id);
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 shadow-2xs"
                        >
                          <UserCheck className="w-3 h-3 text-indigo-600" />
                          <span>{studentObj?.name || `Student #${id}`}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-slate-200 transition-colors"
          >
            Previous Step
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !formData.name.trim()) {
                  addToast('Project Name is required.', 'error');
                  return;
                }
                setStep(step + 1);
              }}
              className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 hover:bg-indigo-700 transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-colors"
            >
              <span>Publish Project</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProjectPage;
