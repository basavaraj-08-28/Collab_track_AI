import React from 'react';

export const SkeletonLoader = ({ type = 'list', count = 3, height = 'h-24' }) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-pulse">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-slate-200/80 rounded-3xl p-6 h-48 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-4 bg-slate-300 rounded-md w-1/3" />
              <div className="h-6 bg-slate-300 rounded-md w-3/4" />
              <div className="h-3 bg-slate-300 rounded-md w-full" />
            </div>
            <div className="h-10 bg-slate-300 rounded-xl w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="bg-slate-100 rounded-3xl p-6 h-72 w-full animate-pulse flex flex-col justify-between">
        <div className="h-5 bg-slate-200 rounded-md w-1/4" />
        <div className="flex items-end justify-between gap-2 h-44 px-4">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-slate-300 rounded-t-lg w-full"
              style={{ height: `${Math.floor(Math.random() * 60) + 30}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className={`bg-slate-200/80 rounded-2xl w-full ${height}`} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
