import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Shown when a request fails, so a failure never looks like "no data yet"
const ErrorState = ({ message = "Couldn't load this.", onRetry, compact = false }) => (
  <div
    role="alert"
    className={`flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 text-red-800 ${compact ? 'p-3 text-sm' : 'p-4'}`}
  >
    <span className="flex items-center gap-2">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      {message}
    </span>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 border border-red-200 hover:bg-red-100"
      >
        <RefreshCw className="w-4 h-4" aria-hidden="true" /> Retry
      </button>
    )}
  </div>
);

export default ErrorState;
