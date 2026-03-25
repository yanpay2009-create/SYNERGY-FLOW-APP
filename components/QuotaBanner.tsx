import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertCircle } from 'lucide-react';

export const QuotaBanner: React.FC = () => {
  const { isQuotaExceeded, refreshAllData } = useApp();

  if (!isQuotaExceeded) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-1.5 flex flex-col sm:flex-row items-center justify-center gap-2 sticky top-0 z-[60] shadow-md animate-in fade-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <AlertCircle size={18} />
        <span className="text-sm font-medium">
          Daily data limit reached. Some features may be limited until tomorrow.
        </span>
      </div>
      <button 
        onClick={refreshAllData}
        className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full border border-white/30 transition-colors font-semibold"
      >
        Try Refresh
      </button>
    </div>
  );
};
