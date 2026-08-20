import React from 'react';
import { FolderOpen } from 'lucide-react';

export const EmptyState = ({ title = 'No Data Found', message = 'There are no items to display right now.', icon: Icon = FolderOpen, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 ring-1 ring-indigo-100">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
