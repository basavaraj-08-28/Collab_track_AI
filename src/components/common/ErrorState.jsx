import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Unable to load data',
  message = 'Something went wrong while retrieving your information.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-50/50 rounded-3xl border border-rose-200/80 shadow-xs my-4">
      <div className="p-3.5 rounded-2xl bg-rose-100 text-rose-600 mb-3.5 ring-1 ring-rose-200">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="text-base font-extrabold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-600 max-w-md mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
