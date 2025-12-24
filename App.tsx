
import React, { useState } from 'react';
import { SyntaxMode } from './components/SyntaxMode';
import { GrammarMode } from './components/GrammarMode';
import { SplashScreen } from './components/SplashScreen';
import { Sparkles, ArrowRight, Layers, Cpu, Component, Wrench } from 'lucide-react';
import { TOPIC_TO_CODE, CODE_TO_TOPIC } from './constants';

type AppView = 
  | { mode: 'LOBBY' }
  | { mode: 'SYNTAX'; initialFocusCode?: number | null }
  | { mode: 'GRAMMAR'; initialTopic?: string | null };

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<AppView>({ mode: 'LOBBY' });

  // --- Navigation Handlers (The Bridge) ---
  const handleNavigateToGrammar = (code: number) => {
    const topicId = CODE_TO_TOPIC[code];
    if (topicId) {
      setView({ mode: 'GRAMMAR', initialTopic: topicId });
    } else {
      // Fallback for codes without specific grammar modules yet
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

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden animate-fade-in">
      {/* Abstract Tech Background */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-rose-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="z-10 w-full max-w-5xl">
        {/* BRAND HEADER */}
        <header className="text-center mb-16 relative">
          <p className="text-xs font-bold text-slate-400 tracking-[0.3em] uppercase mb-4">
             WONSUMMER STUDIO Presents
          </p>
          <h1 className="font-brand text-7xl md:text-8xl font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900">
             SWEEP
          </h1>
          <p className="font-medium text-lg md:text-xl text-slate-500 max-w-lg mx-auto leading-relaxed">
             Swipe to Sweep<br/>
             <span className="text-sm text-slate-400">구조를 쓸어담고, 법칙을 세우다</span>
          </p>
        </header>

        {/* SYSTEM MODULES (CARDS) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
          {/* Module A: SYNTAX ARENA (Indigo/Blue Theme) */}
          <button 
            onClick={() => setView({ mode: 'SYNTAX' })}
            className="group relative bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2.5rem] p-10 shadow-2xl hover:shadow-[0_20px_50px_rgba(79,70,229,0.4)] transition-all duration-300 hover:-translate-y-2 border border-white/10 overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity scale-150 text-white">
              <Component size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full text-white">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                  <Component size={24} className="text-white" />
                </span>
                <span className="text-xs font-black tracking-widest text-indigo-100 uppercase">Module 01</span>
              </div>
              
              <h2 className="font-brand text-3xl md:text-4xl font-black mb-2">
                SYNTAX<br/>CLEANER
              </h2>
              <p className="text-indigo-100 font-medium text-lg mb-8 opacity-90">
                구문 청소기<br/>
                <span className="text-sm opacity-70">Structural Analysis</span>
              </p>
              
              <div className="mt-auto pt-6 border-t border-white/20 flex items-center justify-between font-bold text-white/90 group-hover:text-white transition-colors">
                <span>Enter Arena</span>
                <ArrowRight size={20} />
              </div>
            </div>
          </button>

          {/* Module B: GRAMMAR ENGINE (Rose/Red Theme) */}
          <button 
            onClick={() => setView({ mode: 'GRAMMAR' })}
            className="group relative bg-gradient-to-br from-rose-500 to-red-600 rounded-[2.5rem] p-10 shadow-2xl hover:shadow-[0_20px_50px_rgba(225,29,72,0.4)] transition-all duration-300 hover:-translate-y-2 border border-white/10 overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity scale-150 text-white">
              <Wrench size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col h-full text-white">
              <div className="flex items-center gap-3 mb-6">
                <span className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                  <Wrench size={24} className="text-white" />
                </span>
                <span className="text-xs font-black tracking-widest text-rose-100 uppercase">Module 02</span>
              </div>
              
              <h2 className="font-brand text-3xl md:text-4xl font-black mb-2">
                GRAMMAR<br/>FIXER
              </h2>
              <p className="text-rose-100 font-medium text-lg mb-8 opacity-90">
                문법 수리공<br/>
                <span className="text-sm opacity-70">Concept Installation</span>
              </p>
              
              <div className="mt-auto pt-6 border-t border-white/20 flex items-center justify-between font-bold text-white/90 group-hover:text-white transition-colors">
                <span>Start Engine</span>
                <ArrowRight size={20} />
              </div>
            </div>
          </button>
        </div>
        
        <footer className="mt-20 text-center">
           <p className="text-xs font-bold text-slate-300 tracking-widest uppercase mb-1">
             © 2025 WONSUMMER Corp. All rights reserved.
           </p>
           <p className="text-[10px] text-slate-300">
             Build once. Learn forever.
           </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
