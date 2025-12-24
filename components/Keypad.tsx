import React, { useState, useEffect } from 'react';
import { MODIFIER_TYPES } from '../constants';
import { Lightbulb, ToggleLeft, ToggleRight } from 'lucide-react';

interface KeypadProps {
  onSelect: (code: number) => void;
  onHint: () => void;
  disabled: boolean;
  tutorialHighlightCode?: number | null;
  showHintsByDefault: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ onSelect, onHint, disabled, tutorialHighlightCode, showHintsByDefault }) => {
  const [showVisualHints, setShowVisualHints] = useState(showHintsByDefault);

  // Sync state if prop changes (e.g. level change)
  useEffect(() => {
    setShowVisualHints(showHintsByDefault);
  }, [showHintsByDefault]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1 bg-slate-100 p-2 rounded-lg">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            코드 선택
          </span>
          
          <div className="flex gap-2">
            {/* Visual Hint Toggle */}
            <button
              onClick={() => setShowVisualHints(!showVisualHints)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-all ${showVisualHints ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
              title="형태 힌트 켜기/끄기"
            >
              {showVisualHints ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {showVisualHints ? "힌트 ON" : "힌트 OFF"}
            </button>

            {/* AI Hint Button */}
            <button 
               onClick={onHint}
               disabled={disabled}
               className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-bold hover:bg-amber-200 transition-colors disabled:opacity-50"
            >
               <Lightbulb size={14} /> 정답 힌트
            </button>
          </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 overflow-y-auto pr-1 pb-1 custom-scrollbar">
        {MODIFIER_TYPES.map((type) => {
          const isHighlight = tutorialHighlightCode === type.code;
          return (
            <button
              key={type.code}
              onClick={() => !disabled && onSelect(type.code)}
              className={`
                relative p-3 rounded-xl border-2 text-left transition-all duration-200 group flex flex-col justify-between min-h-[84px]
                ${disabled 
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                  : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:border-indigo-500 hover:ring-2 hover:ring-indigo-100 hover:bg-indigo-50 hover:-translate-y-0.5'}
                ${isHighlight ? 'ring-4 ring-indigo-500 border-indigo-600 bg-indigo-50 scale-105 z-50 shadow-xl' : ''}
              `}
              disabled={disabled}
            >
              <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-lg font-black ${disabled ? 'text-slate-300' : 'text-indigo-600 group-hover:text-indigo-700'}`}>
                      {type.code}
                  </span>
                  {/* Small category tag if hints are off, to give *some* clue but not the answer */}
                  {!showVisualHints && (
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1 rounded">
                      {type.code <= 6 ? "구/절" : "관계사"}
                    </span>
                  )}
              </div>
              <div>
                <span className="text-xs md:text-sm font-bold block leading-tight mb-1 break-keep">{type.name}</span>
                
                {/* Structural Hint - Visual Guide (Conditioned) */}
                {showVisualHints ? (
                  <span className={`text-[11px] block leading-tight break-keep animate-fade-in ${disabled ? 'text-slate-300' : 'text-indigo-600 font-medium bg-indigo-50/50 -mx-1 px-1 rounded'}`}>
                    {type.hint}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-300 block h-[16px]">
                    (가려짐)
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};