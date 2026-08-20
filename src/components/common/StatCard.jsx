import React from 'react';

export const StatCard = ({ title, value, subtext, trend, trendType = 'up', icon: Icon, iconBg = 'bg-blue-50 text-blue-600' }) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${iconBg} ring-1 ring-black/5`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtext && <span className="text-slate-600 font-medium">{subtext}</span>}
          {trend && (
            <span
              className={`font-semibold flex items-center gap-1 ${
                trendType === 'up' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full' : 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full'
              }`}
            >
              {trendType === 'up' ? '↑' : '↓'} {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
