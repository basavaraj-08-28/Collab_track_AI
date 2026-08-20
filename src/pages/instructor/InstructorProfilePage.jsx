import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { instructorService } from '../../services/instructorService';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Shield, Mail, BookOpen, Award, Users, Edit2, Save, FolderKanban } from 'lucide-react';

export const InstructorProfilePage = () => {
  const { user, updateUserProfile } = useAuth();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    department: '',
    instructorId: ''
  });

  useEffect(() => {
    instructorService.getProjects().then((projs) => {
      setProjects(Array.isArray(projs) ? projs : []);
      setLoading(false);
    });

    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        title: user.title || '',
        department: user.department || '',
        instructorId: user.instructorId || ''
      });
    }
  }, [user]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUserProfile(formData);
    addToast('Instructor profile updated!', 'success');
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <SkeletonLoader count={3} height="h-32" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Profile Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-6 relative">
        <UserAvatar name={user?.name || 'Instructor User'} avatar={user?.avatar} size="xl" />

        <div className="text-center md:text-left space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name || 'Instructor'}</h1>
            {user?.instructorId && <Badge variant="primary">ID: {user.instructorId}</Badge>}
            <Badge variant="success">Faculty Account</Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">{user?.title || 'Faculty Member'}</p>
          <p className="text-xs text-slate-400">
            {user?.department || 'Department'} • {user?.email || 'instructor@university.edu'}
          </p>
        </div>

        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-center shrink-0 min-w-[160px]">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Managed Projects</span>
          <span className="text-3xl font-black text-indigo-600">{projects.length} Projects</span>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors text-xs font-bold flex items-center gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Active Managed Projects
          </h3>
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Managed Projects"
              message="Create course projects to begin tracking student collaboration."
            />
          ) : (
            <div className="space-y-3 text-xs">
              {projects.map((proj) => (
                <div key={proj.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{proj.name}</p>
                    <p className="text-[10px] text-slate-500">{proj.code} • {proj.status || 'Active'}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Instructor Account Details
          </h3>
          <div className="space-y-3 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center font-bold">
              <span>Instructor ID</span>
              <span className="text-slate-900">{user?.instructorId || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center font-bold">
              <span>Department</span>
              <span className="text-slate-900">{user?.department || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Instructor Profile">
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InstructorProfilePage;
