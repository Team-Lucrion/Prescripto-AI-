import React from 'react';
import { Star, Zap } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalysisModeToggleProps {
  mode: 'basic' | 'pro';
  onChange: (mode: 'basic' | 'pro') => void;
}

export const AnalysisModeToggle: React.FC<AnalysisModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-md mx-auto mb-8">
      <button
        onClick={() => onChange('basic')}
        className={cn(
          "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all",
          mode === 'basic' ? "bg-white text-[#0f2a43] shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        <Zap className={cn("w-4 h-4", mode === 'basic' ? "text-[#00a3e0]" : "text-slate-400")} />
        <span>Basic (1 Credit)</span>
      </button>
      <button
        onClick={() => onChange('pro')}
        className={cn(
          "flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl text-sm font-bold transition-all",
          mode === 'pro' ? "bg-white text-[#0f2a43] shadow-sm" : "text-slate-500 hover:text-slate-700"
        )}
      >
        <Star className={cn("w-4 h-4", mode === 'pro' ? "text-amber-500 fill-amber-500" : "text-slate-400")} />
        <span>Pro ⭐ (3 Credits)</span>
      </button>
    </div>
  );
};
