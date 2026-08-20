import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import { useToast } from '../../context/ToastContext';
import { PlusCircle, ArrowLeft, ArrowRight, CheckCircle2, Users, Sliders, FileText } from 'lucide-react';

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
    taskWeight: 25,
    participationWeight: 20,
    communicationWeight: 20,
    qualityWeight: 20,
    peerWeight: 15,
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      addToast('Project Name is required.', 'error');
      setStep(1);
      return;
    }

    try {
      await instructorService.createProject(formData);
      addToast(`Project "${formData.name}" created successfully!`, 'success');
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
        <p className="text-xs text-slate-500 mt-1">Configure project parameters, assign student groups, and set AI evaluation weights.</p>
      </div>

      {/* Wizard Steps Navigation */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
        {[
          { num: 1, label: 'General Info' },
          { num: 2, label: 'Group Allocation' },
          { num: 3, label: 'Finalize' },
        ].map((s) => (
          <div
            key={s.num}
            className={`py-2 text-center rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              step === s.num ? 'bg-indigo-600 text-white shadow-xs' : step > s.num ? 'text-indigo-700 bg-indigo-50' : ''
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
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Group Allocation & Setup</h3>
            <p className="text-xs text-slate-500">Group allocations will be initialized for this course project.</p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-slate-700">Project Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
              />
              <label className="block text-xs font-bold text-slate-700 mt-2">Planned Sprint Deliverables Count</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.totalTasks}
                onChange={(e) => setFormData({ ...formData, totalTasks: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Ready to Publish Project</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              "{formData.name || 'New Project'}" will be initialized into the course database.
            </p>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl disabled:opacity-40"
          >
            Previous Step
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
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
