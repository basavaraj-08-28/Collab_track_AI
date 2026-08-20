import React from 'react';

export const ProgressBar = ({ value = 0, max = 100, label, showValue = true, color = 'bg-blue-600', height = 'h-2.5' }) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-medium text-slate-700">
          {label && <span>{label}</span>}
          {showValue && <span className="text-slate-900 font-semibold">{percentage}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-100 rounded-full overflow-hidden ${height} p-0.5 border border-slate-200/50`}>
        <div
          className={`${color} ${height} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
