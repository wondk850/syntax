import React from 'react';
import { TutorialStep } from '../types';
import { Hand, CheckCircle, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, onSkip }) => {
  if (step === TutorialStep.OFF || step === TutorialStep.COMPLETE) return null;

  const getMessage = () => {
    switch(step) {
      case TutorialStep.WELCOME: return "환영합니다! 문장을 청소하는 방법을 알려드릴게요.";
      case TutorialStep.FIND_NOUN: return "먼저, 문장의 주인공인 [명사]를 찾아 터치해보세요.";
      case TutorialStep.QUESTION_POPUP: return "잘했어요! 명사를 찾으면 '어떤?'이라는 질문이 떠오릅니다.";
      case TutorialStep.SELECT_RANGE: return "이제 명사를 꾸며주는 [수식어]의 범위를 선택해보세요.";
      case TutorialStep.SELECT_CODE: return "이 수식어의 종류는 무엇일까요? 코드를 선택하세요.";
      default: return "";
    }
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Dimmed Background */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-500"></div>

      {/* Message Box */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg pointer-events-auto">
        <div className="bg-white rounded-2xl p-6 shadow-2xl border-4 border-indigo-500 animate-fade-in mx-4">
          <div className="flex items-start gap-4">
            <div className="bg-indigo-100 p-3 rounded-full">
               <Hand className="text-indigo-600" size={32} />
            </div>
            <div className="flex-1">
               <h3 className="text-lg font-black text-slate-800 mb-1">
                 Tutorial {step}/5
               </h3>
               <p className="text-slate-600 text-lg font-medium leading-relaxed">
                 {getMessage()}
               </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
             <button onClick={onSkip} className="text-slate-400 text-sm font-bold hover:text-slate-600">
               건너뛰기
             </button>
             {step === TutorialStep.WELCOME && (
               <button onClick={onNext} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2">
                 시작하기 <ArrowRight size={18} />
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};