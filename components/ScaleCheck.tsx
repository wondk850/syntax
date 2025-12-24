import React from 'react';

interface ScaleCheckProps {
  status: 'idle' | 'balanced' | 'unbalanced';
  onCheck: () => void;
}

export const ScaleCheck: React.FC<ScaleCheckProps> = ({ status, onCheck }) => {
  // Rotation calculation
  const rotation = status === 'idle' ? 0 : status === 'balanced' ? 0 : 25;
  const color = status === 'idle' ? 'text-slate-400' : status === 'balanced' ? 'text-green-600' : 'text-red-500';
  const barColor = status === 'idle' ? 'bg-slate-300' : status === 'balanced' ? 'bg-green-500' : 'bg-red-400';

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full">
      <div className="relative w-64 h-32 flex justify-center items-end">
        {/* Base */}
        <div className="w-4 h-24 bg-slate-700 rounded-t-lg z-10"></div>
        <div className="absolute bottom-0 w-32 h-4 bg-slate-800 rounded-full z-10"></div>
        
        {/* Beam */}
        <div 
          className={`absolute top-4 w-56 h-3 rounded-full transition-transform duration-700 ease-spring ${barColor}`}
          style={{ transform: `rotate(${rotation}deg)` }}
        >
           {/* Left Pan (Subject) */}
           <div className="absolute left-0 top-1 w-[1px] h-16 bg-slate-400 origin-top -rotate-[0deg]">
             <div className="absolute bottom-0 -left-6 w-12 h-4 border-b-2 border-slate-400 rounded-b-full bg-white/50 flex items-center justify-center text-xs font-bold">
               S
             </div>
           </div>

           {/* Right Pan (Verb) */}
           <div className="absolute right-0 top-1 w-[1px] h-16 bg-slate-400 origin-top -rotate-[0deg]">
             <div className="absolute bottom-0 -left-6 w-12 h-4 border-b-2 border-slate-400 rounded-b-full bg-white/50 flex items-center justify-center text-xs font-bold">
               V
             </div>
           </div>
        </div>
      </div>

      <button
        onClick={onCheck}
        disabled={status !== 'idle'}
        className={`mt-6 px-8 py-3 rounded-full font-bold shadow-lg transform active:scale-95 transition-all text-white
          ${status !== 'idle' ? 'bg-slate-400 cursor-default' : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500'}
        `}
      >
        {status === 'idle' ? '⚖️ 무게 확인 (Scale Check)' : status === 'balanced' ? 'Perfect!' : 'Try Again'}
      </button>
    </div>
  );
};