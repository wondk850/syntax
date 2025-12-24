import React from 'react';
import { GameStep, SentenceData } from '../types';
import { Hand, ArrowRightLeft } from 'lucide-react';

interface SentenceViewProps {
  data: SentenceData;
  step: GameStep;
  currentModIndex: number; 
  cleanedModifiers: number[]; // Indices of cleaned modifiers
  selectionStart: number | null;
  selectionEnd: number | null;
  onTokenClick: (index: number) => void;
  showQuestionPopup: boolean;
  tutorialHighlightIndex?: number | null; // For tutorial step 1
  tutorialHighlightRange?: { start: number, end: number } | null; // For tutorial step 3
}

export const SentenceView: React.FC<SentenceViewProps> = ({
  data,
  step,
  currentModIndex,
  cleanedModifiers,
  selectionStart,
  selectionEnd,
  onTokenClick,
  showQuestionPopup,
  tutorialHighlightIndex,
  tutorialHighlightRange
}) => {
  return (
    <div className="w-full relative p-6 md:p-10 bg-white rounded-3xl shadow-xl border-2 border-slate-200 flex flex-wrap items-center content-center justify-center gap-x-3 gap-y-6 md:gap-x-4 md:gap-y-8 select-none transition-all min-h-[300px]">
      
      {/* S-V Connector SVG Line (Only valid if we have visual separation, simplified to CSS line for robustness in flex layout, but we can do an overlay) */}
      {/* For this version, we will use robust CSS highlighting and token styling instead of complex coordinate calculation for SVG to avoid misalignment on resize. */}

      {data.tokens.map((token, index) => {
        const isHeadNoun = index === data.headNounIndex;
        const isMainVerb = index === data.mainVerbIndex;
        const isHeadNounFound = step > GameStep.HEAD_NOUN;
        
        // Ghost Mode (Cleaned Modifiers)
        const isCleaned = cleanedModifiers.some(modIdx => {
          const mod = data.modifiers[modIdx];
          return index >= mod.startIndex && index <= mod.endIndex;
        });

        // Range Selection Visuals (Step 3-A)
        let isSelected = false;
        if (step === GameStep.MODIFIER_RANGE && selectionStart !== null) {
          const start = selectionEnd !== null ? Math.min(selectionStart, selectionEnd) : selectionStart;
          const end = selectionEnd !== null ? Math.max(selectionStart, selectionEnd) : selectionStart;
          
          if (index >= start && index <= end) {
            isSelected = true;
          }
        }

        // Tutorial Highlighting
        const isTutorialTarget = tutorialHighlightIndex === index;
        const isTutorialRange = tutorialHighlightRange && index >= tutorialHighlightRange.start && index <= tutorialHighlightRange.end;

        // --- Styles Construction ---
        let containerClasses = "relative transition-all duration-300 ";
        let tokenClasses = "px-2 py-1 md:px-3 md:py-1 rounded-xl transition-all duration-200 text-2xl md:text-4xl lg:text-5xl font-medium tracking-tight border-2 border-transparent ";

        if (step === GameStep.RESULT) {
           // Result State Styles
           if (isHeadNoun) {
             tokenClasses += "text-blue-700 font-black bg-blue-100 ring-4 ring-blue-300 shadow-lg scale-110 z-10";
           } else if (isMainVerb) {
             tokenClasses += "text-red-600 font-black bg-red-100 ring-4 ring-red-300 shadow-lg scale-110 z-10";
           } else if (isCleaned) {
             tokenClasses += "text-slate-200 opacity-20 bg-transparent blur-[1px]"; // Fade out trash
           } else {
             tokenClasses += "text-slate-400 opacity-50"; // Fade context
           }
        } else if (step === GameStep.FIND_VERB) {
            // Find Verb State
           if (isHeadNoun) {
             tokenClasses += "text-blue-700 font-black bg-blue-50 ring-2 ring-blue-300 shadow-md animate-pulse"; // Subject pulses waiting for partner
           } else if (isCleaned) {
             tokenClasses += "text-slate-200 opacity-30 bg-transparent blur-[1px]"; // Trash faded
           } else {
             tokenClasses += "hover:bg-red-50 hover:text-red-600 hover:ring-2 hover:ring-red-200 cursor-pointer text-slate-800 hover:scale-105"; // Interactive for verb finding
           }
        } else {
           // Normal Gameplay Styles
           if (isCleaned) {
             tokenClasses += "text-slate-200 opacity-40 bg-transparent blur-[1px]"; 
           } else if (isHeadNounFound && isHeadNoun) {
             tokenClasses += "text-blue-700 font-bold bg-blue-50 ring-2 ring-blue-200 shadow-sm";
           } else if (isSelected) {
             tokenClasses += "bg-yellow-300 text-slate-900 ring-4 ring-yellow-400 shadow-md transform -translate-y-1";
           } else if (isTutorialTarget || isTutorialRange) {
             tokenClasses += "bg-indigo-100 ring-4 ring-indigo-400 z-50 animate-pulse text-indigo-900 font-bold shadow-2xl scale-110 cursor-pointer";
           } else if (!isCleaned) {
             tokenClasses += "hover:bg-slate-100 active:bg-slate-200 cursor-pointer text-slate-800 hover:scale-105";
           }
        }

        const nextMod = data.modifiers[currentModIndex];
        const questionText = nextMod?.typeCode === 12 || nextMod?.typeCode === 11 ? "무슨?" : "어떤?";
        const showPopup = showQuestionPopup && isHeadNoun;

        return (
          <div key={index} className={containerClasses} onClick={() => step !== GameStep.RESULT && onTokenClick(index)}>
            <span className={tokenClasses}>{token}</span>
            
            {/* Badges for Result Step */}
            {step === GameStep.RESULT && isHeadNoun && (
               <>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shadow-sm whitespace-nowrap animate-bounce">Subject</div>
               </>
            )}
            {step === GameStep.RESULT && isMainVerb && (
               <>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 shadow-sm whitespace-nowrap animate-bounce">Verb</div>
               </>
            )}
            
            {/* Find Verb Hint */}
            {step === GameStep.FIND_VERB && isHeadNoun && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold text-blue-400">
                    짝(Verb)을 찾으세요!
                </div>
            )}

            {/* Tutorial Hand Icon */}
            {isTutorialTarget && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
                <Hand size={48} className="text-indigo-600 fill-indigo-200" />
              </div>
            )}

            {/* Popup */}
            {showPopup && (
               <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-30 animate-bounce pointer-events-none">
                 <div className="bg-indigo-600 text-white text-2xl md:text-3xl font-bold px-6 py-3 rounded-2xl shadow-2xl whitespace-nowrap relative border-4 border-white">
                   {questionText}
                   <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rotate-45"></div>
                 </div>
               </div>
            )}
          </div>
        );
      })}
      
      {/* S-V Connector Line (Visual Flair for Result) */}
      {step === GameStep.RESULT && (
         <div className="absolute inset-x-0 bottom-4 h-2 bg-gradient-to-r from-blue-300 via-purple-300 to-red-300 opacity-30 rounded-full blur-xl animate-pulse pointer-events-none" />
      )}
    </div>
  );
};