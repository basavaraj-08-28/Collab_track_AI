import React, { useState, useEffect } from 'react';
import { instructorService } from '../../services/instructorService';
import GroupComparisonChart from '../../components/charts/GroupComparisonChart';
import Badge from '../../components/common/Badge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { Layers, PlusCircle, Users } from 'lucide-react';

export const GroupComparisonPage = () => {
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [projectName, setProjectName] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await instructorService.getGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve group comparison data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    try {
      const newGroup = await instructorService.createGroup({
        name: groupName,
        projectName: projectName || 'General Project'
      });
      setGroups((prev) => [newGroup, ...prev]);
      addToast(`Group "${groupName}" created!`, 'success');
      setShowAddModal(false);
      setGroupName('');
      setProjectName('');
    } catch (err) {
      addToast('Failed to create group.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <SkeletonLoader count={3} height="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load groups" message={error} onRetry={fetchGroups} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Group & Team Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Comparative performance analysis of student project teams across collaboration metrics.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Group</span>
        </button>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Groups Created"
          message="Groups will appear here after you create them."
          actionLabel="Create Group"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Team Performance Multi-Metric Chart</h3>
            <GroupComparisonChart data={groups} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {groups.map((team, idx) => {
              const scoreVal = team.collaborationScore || team.score || 0;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl p-6 border shadow-xs space-y-3 ${
                    scoreVal >= 85
                      ? 'border-emerald-200/80'
                      : scoreVal >= 70
                      ? 'border-indigo-200/80'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-slate-900">{team.name || team.group}</h4>
                    <Badge variant={scoreVal >= 85 ? 'success' : scoreVal >= 70 ? 'blue' : 'default'}>
                      {scoreVal >= 85 ? 'Active' : 'Group'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Project:</span>
                      <span className="font-bold text-slate-900">{team.projectName || 'Assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span className="font-bold text-slate-900">{(team.members || []).length} Students</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collaboration Score:</span>
                      <span className="font-bold text-indigo-600">
                        {team.collaborationScore ? `${team.collaborationScore} / 100` : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Group Modal */}
      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Student Group">
          <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Group / Team Name</label>
              <input
                type="text"
                placeholder="e.g. Team Alpha"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Associated Project Name</label>
              <input
                type="text"
                placeholder="e.g. Smart Campus Management System"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
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
                Create Group
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default GroupComparisonPage;
