import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Lock } from 'lucide-react';

interface ProUpsellProps {
  onUpgrade: () => void;
  isProcessing: boolean;
}

export const ProUpsell: React.FC<ProUpsellProps> = ({ onUpgrade, isProcessing }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 relative overflow-hidden bg-[#0f2a43] rounded-[2.5rem] p-8 text-white shadow-xl shadow-slate-200"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Star className="w-32 h-32 rotate-12" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-4">
          <div className="bg-amber-500 p-1.5 rounded-lg">
            <Lock className="w-4 h-4 text-[#0f2a43]" />
          </div>
          <span className="text-amber-500 font-bold text-sm tracking-wider uppercase">Pro Insight Available</span>
        </div>
        
        <h3 className="text-2xl font-bold mb-3">You may save ₹150–₹400 on this prescription</h3>
        <p className="text-slate-400 mb-6 max-w-md">
          Unlock generic alternatives, detailed cost benchmarks, and safety warnings for this document.
        </p>
        
        <button
          disabled={isProcessing}
          onClick={onUpgrade}
          className="bg-white text-[#0f2a43] px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Unlock for 2 more credits</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
