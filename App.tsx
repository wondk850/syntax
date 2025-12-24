
import React, { useState } from 'react';
import { SyntaxMode } from './components/SyntaxMode';
import { GrammarMode } from './components/GrammarMode';
import { Sparkles, ArrowRight, Layers, Cpu, Component } from 'lucide-react';
import { TOPIC_TO_CODE, CODE_TO_TOPIC } from './constants';

type AppView = 
  | { mode: 'LOBBY' }
  | { mode: 'SYNTAX'; initialFocusCode?: number | null }
  | { mode: 'GRAMMAR'; initialTopic?: string | null };

const App: React.FC = () => {
  const [view, setView] = useState<AppView>({ mode: 'LOBBY' });

  // --- Navigation Handlers (The Bridge) ---
  const handleNavigateToGrammar = (code: number) => {
    const topicId = CODE_TO_TOPIC[code];
    if (topicId) {
      setView({ mode: 'GRAMMAR', initialTopic: topicId });
    } else {
      alert("System Update Required: Module not yet available.");
      setView({ mode: 'GRAMMAR' });
    }
  };

  const handleNavigateToSyntax = (topicId: string) => {
    const code = TOPIC_TO_CODE[topicId];
    if (code) {
      setView({ mode: 'SYNTAX', initialFocusCode: code });
    } else {
      setView({ mode: 'SYNTAX' });
    }
  };

  if (view.mode === 'SYNTAX') {
    return (
      <SyntaxMode 
        onBack={() => setView({ mode: 'LOBBY' })} 
        initialFocusCode={view.initialFocusCode}
        onGoToGrammar={handleNavigateToGrammar}
      />
    );
  }

  if (view.mode === 'GRAMMAR') {
    return (
      <GrammarMode 
        onBack={() => setView({ mode: 'LOBBY' })} 
        initialTopic={view.initialTopic}
        onGoToSyntax={handleNavigateToSyntax}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Abstract Tech Background */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="z-10 w-full max-w-5xl">
        {/* BRAND HEADER */}
        <header className="text-center mb-20 relative">
          <div className="flex flex-col items-center justify-center">
             <div className="mb-4 p-4 bg-slate-900 text-white rounded-2xl shadow-xl">
               <Layers size={40} strokeWidth={1.5} />
             </div>
             <h1 className="font-brand text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-2">
               WONSUMMER <span className="text-indigo-600">STUDIO</span>
             </h1>
             <p className="font-brand text-xl md:text-2xl text-slate-400 font-bold tracking-wide">
               Build once. Learn forever.
             </p>
             <div className="w-16 h-1 bg-indigo-600 mt-6 rounded-full"></div>
             <p className="mt-6 text-sm md:text-base text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
               We design systems where learning becomes a default.
             </p>
          </div>
        </header>

        {/* SYSTEM MODULES (CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {/* Module A: SYNTAX ARENA */}
          <button 
            onClick={() => setView({ mode: 'SYNTAX' })}
            className="group relative bg-white rounded-[2rem] p-10 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 border border-slate-100 overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity scale-150">
              <Component size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Component size={24} />
                </span>
                <span className="text-xs font-black tracking-widest text-indigo-600 uppercase">System Module 01</span>
              </div>
              
              <h2 className="font-brand text-3xl md:text-4xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                SYNTAX ARENA
              </h2>
              <p className="text-slate-400 font-medium text-lg mb-8">
                Structural Analysis & Logic Training
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between text-slate-600 font-bold group-hover:text-indigo-600 transition-colors">
                <span>Enter Arena</span>
                <ArrowRight size={20} />
              </div>
            </div>
          </button>

          {/* Module B: GRAMMAR ENGINE */}
          <button 
            onClick={() => setView({ mode: 'GRAMMAR' })}
            className="group relative bg-white rounded-[2rem] p-10 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-2 border border-slate-100 overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity scale-150">
              <Cpu size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Cpu size={24} />
                </span>
                <span className="text-xs font-black tracking-widest text-purple-600 uppercase">System Module 02</span>
              </div>
              
              <h2 className="font-brand text-3xl md:text-4xl font-black text-slate-800 mb-2 group-hover:text-purple-600 transition-colors">
                GRAMMAR ENGINE
              </h2>
              <p className="text-slate-400 font-medium text-lg mb-8">
                Concept Installation & Pattern Optimization
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between text-slate-600 font-bold group-hover:text-purple-600 transition-colors">
                <span>Start Engine</span>
                <ArrowRight size={20} />
              </div>
            </div>
          </button>
        </div>
        
        <footer className="mt-20 text-center">
           <p className="text-xs font-bold text-slate-300 tracking-widest uppercase">
             © WONSUMMER STUDIO. All Systems Operational.
           </p>
           <p className="text-[10px] text-slate-300 mt-2">
             Legacy Support: Absolute English System v3.0
           </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
