import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import UserAvatar from '../../components/common/UserAvatar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { GraduationCap, Search, Eye, PlusCircle, UserPlus } from 'lucide-react';

export const StudentContributionsPage = () => {
  const { navigateTo } = useAuth();
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [instructorProjects, setInstructorProjects] = useState([]);
  const [selectedProjectMap, setSelectedProjectMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for adding new real student
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    studentId: '',
    project: '',
    group: ''
  });

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getStudents();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve students database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorProjects = async () => {
    try {
      const projs = await instructorService.getProjects();
      setInstructorProjects(Array.isArray(projs) ? projs : []);
    } catch (err) {
      console.error('Failed to load instructor projects:', err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchInstructorProjects();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      addToast('Student Name and Email are required.', 'error');
      return;
    }

    try {
      const added = await instructorService.addStudent(newStudent);
      setStudents((prev) => [added, ...prev]);
      addToast(`Student "${added.name}" enrolled successfully!`, 'success');
      setShowAddModal(false);
      setNewStudent({ name: '', email: '', studentId: '', project: '', group: '' });
      fetchStudents();
    } catch (err) {
      addToast('Failed to enroll student.', 'error');
    }
  };

  const handleAssignProject = async (studentRow) => {
    const projectId = selectedProjectMap[studentRow.id];
    if (!projectId || String(projectId).trim() === '') {
      addToast('Please select a project.', 'error');
      return;
    }

    try {
      const res = await instructorService.assignProject(studentRow.id, projectId);
      addToast(res.message || `Project assigned successfully to ${studentRow.name}.`, 'success');
      fetchStudents();
    } catch (err) {
      addToast(err.message || 'Failed to assign project.', 'error');
    }
  };

  const columns = [
    {
      header: 'Student Name',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={val || 'Student'} avatar={row.avatar} size="sm" />
          <div>
            <span className="font-bold text-slate-900 block">{val}</span>
            <span className="text-[10px] text-slate-400 font-medium">{row.group || 'No Group'}</span>
          </div>
        </div>
      )
    },
    { header: 'Student ID', key: 'studentId', render: (val) => <span className="font-mono text-xs">{val || 'N/A'}</span> },
    { header: 'Project', key: 'project', render: (val) => <Badge variant="blue">{val || 'Unassigned'}</Badge> },
    {
      header: 'Score',
      key: 'collaborationScore',
      render: (val, row) => (
        <span className="font-extrabold text-indigo-600 text-sm">
          {val !== undefined && val !== null ? `${val} / 100` : row.score ? `${row.score} / 100` : 'Pending'}
        </span>
      )
    },
    {
      header: 'Assign Project',
      key: 'assignProjectControl',
      sortable: false,
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <select
            value={selectedProjectMap[row.id] || ''}
            onChange={(e) =>
              setSelectedProjectMap((prev) => ({ ...prev, [row.id]: e.target.value }))
            }
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[160px]"
          >
            <option value="">Select Project</option>
            {instructorProjects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleAssignProject(row)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            Assign Project
          </button>
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      render: (val) => (
        <Badge variant={val === 'Active' ? 'success' : val === 'At Risk' ? 'danger' : 'default'}>
          {val || 'Active'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      sortable: false,
      render: (_, row) => (
        <button
          onClick={() => setSelectedStudent(row)}
          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Inspect</span>
        </button>
      )
    }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-20" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load students" message={error} onRetry={fetchStudents} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            Student Management & Contributions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real student roster enrolled across course projects and collaboration tracking.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Students Added"
          message="Add students to your project to begin tracking collaboration."
          actionLabel="Add Student"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <DataTable columns={columns} data={students} searchPlaceholder="Search enrolled students..." />
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Enroll Real Student">
          <form onSubmit={handleAddStudent} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                placeholder="e.g. j.doe@university.edu"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Student ID</label>
                <input
                  type="text"
                  placeholder="e.g. STD-2026-901"
                  value={newStudent.studentId}
                  onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Group</label>
                <input
                  type="text"
                  placeholder="e.g. Team Alpha"
                  value={newStudent.group}
                  onChange={(e) => setNewStudent({ ...newStudent, group: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Project</label>
              <input
                type="text"
                placeholder="e.g. Smart Campus Management System"
                value={newStudent.project}
                onChange={(e) => setNewStudent({ ...newStudent, project: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs"
              >
                Add Student
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inspect Student Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`Student: ${selectedStudent.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <UserAvatar name={selectedStudent.name} avatar={selectedStudent.avatar} size="lg" />
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{selectedStudent.name}</h4>
                <p className="text-xs text-slate-500">{selectedStudent.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  ID: {selectedStudent.studentId || 'N/A'} • Group: {selectedStudent.group || 'Unassigned'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 font-semibold">
              Project: {selectedStudent.project || 'Unassigned'}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default StudentContributionsPage;
