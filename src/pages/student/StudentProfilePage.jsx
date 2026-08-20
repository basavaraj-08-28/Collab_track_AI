import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { User, Mail, GraduationCap, Award, BookOpen, Edit2, CheckCircle2, Save, FolderKanban } from 'lucide-react';

export const StudentProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    semester: '',
    studentId: ''
  });

  useEffect(() => {
    studentService.getProjects().then((data) => {
      setProjects(Array.isArray(data) ? data : []);
      setLoading(false);
    });

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        semester: user.semester || '',
        studentId: user.studentId || ''
      });
    }
  }, [user]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile(formData);
    addToast('Profile updated successfully!', 'success');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-32" />
      </div>
    );
  }

  const hasScore = user?.overallScore !== null && user?.overallScore !== undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Profile Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-6 relative">
        <UserAvatar name={user?.name || 'Student'} avatar={user?.avatar} size="xl" />

        <div className="text-center md:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {user?.name || 'Authenticated Student'}
            </h1>
            {user?.studentId && <Badge variant="primary">ID: {user.studentId}</Badge>}
            <Badge variant="success">Authenticated</Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">{user?.department || 'Department Not Set'}</p>
          <p className="text-xs text-slate-400">
            {user?.semester || 'Semester Not Set'} • {user?.email || 'No email associated'}
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center shrink-0 min-w-[160px]">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
            Collaboration Metric
          </span>
          {hasScore ? (
            <>
              <span className="text-3xl font-black text-indigo-600">{user.overallScore} / 100</span>
              <span className="block text-[10px] text-emerald-600 font-bold mt-0.5">
                {user.scoreLabel || 'Active'}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400 font-semibold block mt-1">No Score Generated Yet</span>
          )}
        </div>

        {/* Edit Button */}
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
          title="Edit Profile"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit Profile</span>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enrolled Assigned Projects */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Assigned Group Projects
          </h3>

          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Projects Assigned"
              message="Your assigned projects will appear here when an instructor adds you to a project."
            />
          ) : (
            <div className="space-y-3 text-xs">
              {projects.map((proj) => (
                <div key={proj.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{proj.name}</p>
                    <p className="text-slate-500 text-[10px]">{proj.code} • {proj.group}</p>
                  </div>
                  <Badge variant={proj.status === 'Active' ? 'success' : 'warning'}>
                    {proj.status || 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System & Activity Status */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            Student Account Details
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Full Name</span>
              <span className="font-bold text-slate-900">{user?.name || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Email Address</span>
              <span className="font-bold text-slate-900">{user?.email || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Student ID</span>
              <span className="font-bold text-slate-900">{user?.studentId || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Department</span>
              <span className="font-bold text-slate-900">{user?.department || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Academic Semester</span>
              <span className="font-bold text-slate-900">{user?.semester || 'Not provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Student Profile">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student ID</label>
              <input
                type="text"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Semester</label>
              <input
                type="text"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentProfilePage;
