import React, { useState } from 'react';
import { MODIFIER_TYPES } from '../constants';
import { Keypad } from './Keypad';
import { GameStep, Modifier, Difficulty } from '../types';
import { BookOpen, Search, Eye, EyeOff, Lock } from 'lucide-react';

interface ToolsPanelProps {
  step: GameStep;
  activeModifier: Modifier | undefined;
  onKeypadSelect: (code: number) => void;
  onHint: () => void;
  tutorialHighlightCode?: number | null;
  currentLevel: Difficulty | 'landfill';
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  step,
  activeModifier,
  onKeypadSelect,
  onHint,
  tutorialHighlightCode,
  currentLevel
}) => {
  const [isReferenceRevealed, setIsReferenceRevealed] = useState(false);

  // If we are in the specific step to input code, show the Keypad
  if (step === GameStep.MODIFIER_TYPE) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="mb-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
          <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Search size={18} className="text-indigo-600" />
            수식어 분석 중...
          </h3>
          <p className="text-sm text-slate-500">
            하이라이트된 영역에 알맞은<br/>
            <span className="font-bold text-indigo-600">문법 코드 번호</span>를 누르세요.
          </p>
        </div>
        <div className="flex-1 min-h-0">
          <Keypad 
            onSelect={onKeypadSelect} 
            onHint={onHint}
            disabled={false}
            tutorialHighlightCode={tutorialHighlightCode}
            showHintsByDefault={currentLevel === 'beginner'} // Only show visual hints by default for beginners
          />
        </div>
      </div>
    );
  }

  // Otherwise, show the Reference List (Cheat Sheet) WITH BLIND MODE
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      <div className="p-4 bg-indigo-50 border-b border-indigo-100 shrink-0 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-indigo-900 flex items-center gap-2">
            <BookOpen size={18} />
            SWEEP 족보
          </h3>
          <p className="text-xs text-indigo-700 mt-1">
            총 17개 유형 전체 보기
          </p>
        </div>
        <button 
          onClick={() => setIsReferenceRevealed(!isReferenceRevealed)}
          className="p-2 rounded-full hover:bg-indigo-100 text-indigo-600 transition-colors"
          title={isReferenceRevealed ? "가리기" : "보기"}
        >
          {isReferenceRevealed ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar relative">
        {/* Blind Curtain */}
        {!isReferenceRevealed && (
          <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/60 flex flex-col items-center justify-center text-center p-6">
            <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
              <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-700 mb-1">족보가 가려져 있습니다</h4>
              <p className="text-xs text-slate-500 mb-3">
                기억력 향상을 위해 보지 않고<br/>생각해보는 습관을 기르세요!
              </p>
              <button 
                onClick={() => setIsReferenceRevealed(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Eye size={14} /> 잠깐 훔쳐보기
              </button>
            </div>
          </div>
        )}

        {MODIFIER_TYPES.map((type) => (
          <div key={type.code} className={`bg-white p-3 rounded-lg border border-slate-200 transition-all shadow-sm group ${!isReferenceRevealed ? 'blur-[3px] opacity-50 select-none' : ''}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                {type.code}
              </span>
              <span className="text-xs text-slate-400 font-medium">{type.question}</span>
            </div>
            <div className="font-bold text-slate-800 text-sm mb-1">{type.name}</div>
            <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mt-2 font-mono leading-relaxed">
              <span className="text-indigo-500 font-bold mr-1">Hint:</span> 
              {type.hint}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
