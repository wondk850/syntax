import React, { useState } from 'react';
import { SyntaxMode } from './components/SyntaxMode';
import { GrammarMode } from './components/GrammarMode';
import { Sparkles, Wrench, GraduationCap, ArrowRight } from 'lucide-react';

type AppMode = 'LOBBY' | 'SYNTAX' | 'GRAMMAR';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('LOBBY');

  if (mode === 'SYNTAX') {
    return <SyntaxMode onBack={() => setMode('LOBBY')} />;
  }

  if (mode === 'GRAMMAR') {
    return <GrammarMode onBack={() => setMode('LOBBY')} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <div className="z-10 w-full max-w-4xl">
        <header className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-4 bg-white rounded-2xl shadow-lg mb-6">
             <GraduationCap size={48} className="text-indigo-600" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-800 mb-4 tracking-tighter">
            ABSOLUTE <span className="text-indigo-600">ENGLISH</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 font-medium">
            절대영문법: 구조와 원리를 꿰뚫는 통합 학습 솔루션
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card A: Syntax Mode */}
          <button 
            onClick={() => setMode('SYNTAX')}
            className="group relative bg-white rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-indigo-500 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={120} />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full text-sm mb-4">
                구문 훈련소
              </span>
              <h2 className="text-3xl font-black text-slate-800 mb-2">문장 청소기</h2>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                문장이 너무 길고 복잡한가요?<br/>
                수식어를 발라내고 뼈대를 찾는 훈련.
              </p>
              <div className="flex items-center gap-2 font-bold text-indigo-600 group-hover:gap-4 transition-all">
                청소 시작하기 <ArrowRight size={20} />
              </div>
            </div>
          </button>

          {/* Card B: Grammar Mode */}
          <button 
            onClick={() => setMode('GRAMMAR')}
            className="group relative bg-white rounded-[2rem] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-purple-500 text-left overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wrench size={120} />
            </div>
            <div className="relative z-10">
              <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 font-bold rounded-full text-sm mb-4">
                문법 수리공
              </span>
              <h2 className="text-3xl font-black text-slate-800 mb-2">문법 마스터</h2>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                개념 학습부터 테트리스 퍼즐까지.<br/>
                고급 단계엔 <span className="text-red-500 font-bold">함정(Trap)</span>이 숨어있습니다.
              </p>
              <div className="flex items-center gap-2 font-bold text-purple-600 group-hover:gap-4 transition-all">
                수리 시작하기 <ArrowRight size={20} />
              </div>
            </div>
          </button>
        </div>
        
        <footer className="mt-16 text-center text-slate-400 font-medium text-sm">
           Licensed for Classroom Use Only
        </footer>
      </div>
    </div>
  );
};

export default App;