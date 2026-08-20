import React from 'react';

export const ScoreCircle = ({ score = 84, size = 160, strokeWidth = 12, label = 'Excellent Collaboration', sublabel = 'Top 10% of Class' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#3b82f6'; // default blue
  if (score >= 90) strokeColor = '#059669'; // emerald
  else if (score >= 80) strokeColor = '#4f46e5'; // indigo
  else if (score >= 70) strokeColor = '#d97706'; // amber
  else strokeColor = '#e11d48'; // rose

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{score}</span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">/ 100</span>
        </div>
      </div>

      {label && (
        <div className="mt-4 text-center">
          <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
            {label}
          </span>
          {sublabel && <p className="text-xs text-slate-500 font-medium mt-1">{sublabel}</p>}
        </div>
      )}
    </div>
  );
};

export default ScoreCircle;
