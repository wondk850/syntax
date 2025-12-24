import React, { useState } from 'react';
import { X, ClipboardPaste, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

interface CustomInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export const CustomInputModal: React.FC<CustomInputModalProps> = ({ isOpen, onClose, onSubmit, isLoading }) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isLoading ? onClose : undefined} />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-fade-in flex flex-col">
        <button 
          onClick={onClose} 
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
            <ClipboardPaste size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">지문 붙여넣기 (Beta)</h3>
            <p className="text-sm text-slate-500">교과서나 모의고사 지문을 복사해서 넣어보세요.</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-4 flex gap-2">
            <AlertTriangle className="text-amber-500 shrink-0" size={16} />
            <p className="text-xs text-amber-700 font-medium">
               너무 긴 지문은 분석에 시간이 걸릴 수 있습니다. (권장: 3~5 문장)
            </p>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="예시: The student studying in the library is my friend."
          className="w-full h-40 p-4 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-slate-700 mb-6 font-medium leading-relaxed"
          disabled={isLoading}
        />

        <button 
          onClick={() => text.trim() && onSubmit(text)}
          disabled={!text.trim() || isLoading}
          className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              AI가 문장을 쪼개고 분석 중...
            </>
          ) : (
            <>
              게임으로 변환하기 <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};