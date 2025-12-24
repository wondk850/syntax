import React from 'react';
import { DiagnosisStats } from '../types';
import { MODIFIER_TYPES } from '../constants';
import { Activity, ArrowRight, RefreshCcw, TrendingUp, AlertTriangle } from 'lucide-react';

interface DiagnosisViewProps {
  stats: DiagnosisStats;
  onContinue: () => void;
  onRetryWeakness: () => void;
  onExit: () => void;
}

export const DiagnosisView: React.FC<DiagnosisViewProps> = ({ stats, onContinue, onRetryWeakness, onExit }) => {
  const weakModName = stats.weakestModifierCode 
    ? MODIFIER_TYPES.find(m => m.code === stats.weakestModifierCode)?.name 
    : "없음";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full animate-fade-in p-8 text-center">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-indigo-100 max-w-2xl w-full">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <Activity size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">AI 학습 진단 리포트</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <span className="text-sm text-slate-500 font-bold uppercase block mb-1">정답률 (Accuracy)</span>
            <span className={`text-4xl font-black ${stats.accuracy >= 80 ? 'text-green-500' : stats.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {Math.round(stats.accuracy)}%
            </span>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <span className="text-sm text-slate-500 font-bold uppercase block mb-1">취약 유형 (Weakness)</span>
            <span className="text-2xl font-black text-slate-800 break-keep">
              {weakModName}
            </span>
            {stats.weakestModifierCode && (
              <span className="block text-xs text-red-400 font-bold mt-1">Code {stats.weakestModifierCode}</span>
            )}
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-8 text-left">
           <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
             <TrendingUp size={18} /> 닥터 AI의 소견
           </h3>
           <p className="text-indigo-800 leading-relaxed font-medium">
             "{stats.feedback}"
           </p>
        </div>

        <div className="flex flex-col gap-3">
          {stats.weakestModifierCode && (
             <button 
               onClick={onRetryWeakness}
               className="w-full py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
             >
               <AlertTriangle size={20} />
               취약 유형({weakModName}) 10문제 집중 처방받기
             </button>
          )}
          
          <button 
            onClick={onContinue}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <RefreshCcw size={20} />
            새로운 10문제 계속 풀기 (데이터 누적)
          </button>
          
          <button 
            onClick={onExit}
            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 flex items-center justify-center gap-2"
          >
            오늘은 그만하기
          </button>
        </div>
      </div>
    </div>
  );
};