import React, { useState } from 'react';
import { GrammarData, GrammarLevel } from '../types';
import { generateGrammarData } from '../services/ai';
import { Loader2, ArrowRight, Brain, CheckCircle, XCircle, Siren, Home, Map, Zap, Layers } from 'lucide-react';

interface GrammarModeProps {
  onBack: () => void;
}

type Phase = 'TOPIC_SELECT' | 'LOADING' | 'CONCEPT' | 'QUIZ' | 'PUZZLE' | 'SUCCESS';

// Helper Icon Component
const LinkIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
);

// Organized "Map" of Grammar Topics
const GRAMMAR_ZONES = [
  {
    id: 'verbals',
    title: '동사의 변신 (Verbals)',
    subtitle: '동사가 가면을 쓰고 명사/형용사로 변신!',
    icon: <Zap size={24} className="text-amber-500" />,
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    topics: [
      { id: 'to_inf_noun', label: 'To부정사 (명사적)', eng: 'To-Inf (Noun)' },
      { id: 'to_inf_adj', label: 'To부정사 (형용사/부사)', eng: 'To-Inf (Adj/Adv)' },
      { id: 'gerund', label: '동명사', eng: 'Gerund' },
      { id: 'participle', label: '분사 (현재/과거)', eng: 'Participle' }
    ]
  },
  {
    id: 'connectors',
    title: '문장 연결고리 (Connectors)',
    subtitle: '짧은 문장을 길게 이어 붙이는 마법',
    icon: <LinkIcon size={24} className="text-indigo-500" />,
    color: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    topics: [
      { id: 'rel_pronoun', label: '관계대명사 (주격/목적격)', eng: 'Rel. Pronoun' },
      { id: 'rel_adverb', label: '관계부사 (Where/When)', eng: 'Rel. Adverb' },
      { id: 'conjunctions', label: '접속사 (If/Because)', eng: 'Conjunctions' },
      { id: 'rel_what', label: '관계대명사 What', eng: 'Rel. What' }
    ]
  },
  {
    id: 'structure',
    title: '문장의 맛 (Voice & Mood)',
    subtitle: '문장의 느낌과 태도를 바꿔보자!',
    icon: <Layers size={24} className="text-emerald-500" />,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    topics: [
      { id: 'passive', label: '수동태', eng: 'Passive Voice' },
      { id: 'subjunctive', label: '가정법 과거', eng: 'Subjunctive Past' },
      { id: 'comparison', label: '비교급과 최상급', eng: 'Comparison' },
      { id: 'auxiliary', label: '조동사', eng: 'Auxiliary Verbs' }
    ]
  }
];

export const GrammarMode: React.FC<GrammarModeProps> = ({ onBack }) => {
  const [phase, setPhase] = useState<Phase>('TOPIC_SELECT');
  const [level, setLevel] = useState<GrammarLevel>('beginner');
  const [data, setData] = useState<GrammarData | null>(null);
  
  // Phase State
  const [quizIdx, setQuizIdx] = useState(0);
  const [placedBlocks, setPlacedBlocks] = useState<string[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const loadTopic = async (topicLabel: string) => {
    setPhase('LOADING');
    // Pass the full label (Korean + English) to AI so it knows exactly what to teach
    const result = await generateGrammarData(topicLabel, level);
    if (result) {
      setData(result);
      // Init Puzzle State
      const chunks = [...result.puzzle.chunks];
      if (result.puzzle.distractor) chunks.push(result.puzzle.distractor);
      // Shuffle
      for (let i = chunks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
      }
      setAvailableBlocks(chunks);
      setPlacedBlocks([]);
      setPhase('CONCEPT');
    } else {
      setPhase('TOPIC_SELECT');
      alert("AI가 수업을 준비하지 못했습니다. 다시 시도해주세요.");
    }
  };

  const handleQuizAnswer = (option: string) => {
    if (!data) return;
    const currentQuiz = data.quizzes[quizIdx];
    if (option === currentQuiz.answer) {
      // Correct
      if (quizIdx < data.quizzes.length - 1) {
        setQuizIdx(prev => prev + 1);
      } else {
        setPhase('PUZZLE');
        setMessage("마지막 관문: 문장을 올바르게 조립하세요!");
      }
    } else {
      // Wrong
      alert("틀렸습니다! 다시 생각해보세요.\n\n" + currentQuiz.explanation);
    }
  };

  const handleBlockClick = (block: string, from: 'available' | 'placed') => {
    if (from === 'available') {
      setAvailableBlocks(prev => prev.filter(b => b !== block));
      setPlacedBlocks(prev => [...prev, block]);
    } else {
      setPlacedBlocks(prev => prev.filter(b => b !== block));
      setAvailableBlocks(prev => [...prev, block]);
    }
    setMessage("");
    setIsError(false);
  };

  const checkPuzzle = () => {
    if (!data) return;
    
    // Check for Trap
    if (data.puzzle.distractor && placedBlocks.includes(data.puzzle.distractor)) {
      setIsError(true);
      setMessage("🚨 함정 카드 발동! 불필요한 단어가 섞여 있습니다.");
      return;
    }

    // Check Order
    const currentStr = placedBlocks.join(" ").replace(/\s+/g, " ").trim();
    const correctStr = data.puzzle.correct_order.join(" ").replace(/\s+/g, " ").trim();

    if (currentStr === correctStr) {
      setPhase('SUCCESS');
    } else {
      setIsError(true);
      setMessage("순서가 틀렸거나 블록이 부족합니다.");
    }
  };

  // --- RENDERERS ---

  if (phase === 'TOPIC_SELECT') {
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <header className="flex items-center justify-between mb-8">
             <button onClick={onBack} className="p-3 bg-white rounded-full shadow-md text-slate-600 hover:text-indigo-600 transition-colors">
               <Home size={24}/>
             </button>
             <div className="text-center">
               <h2 className="text-3xl font-black text-slate-800 flex items-center gap-2 justify-center">
                 <Map className="text-indigo-600"/> 절대영문법 월드맵
               </h2>
               <p className="text-slate-500 font-medium">탐험하고 싶은 문법 구역(Zone)을 선택하세요.</p>
             </div>
             <div className="w-12"></div> {/* Spacer */}
          </header>

          {/* Level Toggle */}
          <div className="flex justify-center gap-4 mb-10">
            <button 
              onClick={() => setLevel('beginner')} 
              className={`px-6 py-2 rounded-full font-bold transition-all shadow-md ${level === 'beginner' ? 'bg-indigo-600 text-white scale-105 ring-2 ring-indigo-300' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              초급 (덩어리 배열)
            </button>
            <button 
              onClick={() => setLevel('advanced')} 
              className={`px-6 py-2 rounded-full font-bold transition-all shadow-md ${level === 'advanced' ? 'bg-red-500 text-white scale-105 ring-2 ring-red-300' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              고급 (함정 포함)
            </button>
          </div>

          {/* Map Zones */}
          <div className="space-y-8 pb-12">
            {GRAMMAR_ZONES.map((zone) => (
              <div key={zone.id} className={`rounded-3xl p-6 md:p-8 border-2 shadow-sm ${zone.color} transition-all hover:shadow-lg`}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    {zone.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black mb-1">{zone.title}</h3>
                    <p className="text-sm font-bold opacity-70">{zone.subtitle}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {zone.topics.map((topic) => (
                    <button 
                      key={topic.id}
                      onClick={() => loadTopic(topic.label)}
                      className="bg-white/80 hover:bg-white p-4 rounded-xl text-left border border-transparent hover:border-current shadow-sm hover:shadow-md transition-all group"
                    >
                      <span className="block font-bold text-slate-800 mb-1 group-hover:text-current">{topic.label}</span>
                      <span className="block text-xs font-semibold opacity-50">{topic.eng}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'LOADING') {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col items-center justify-center p-4 text-center">
        <Loader2 size={64} className="text-indigo-600 animate-spin mb-6"/>
        <h2 className="text-2xl font-black text-indigo-900 mb-2">AI 선생님이 수업 자료를 만들고 있어요!</h2>
        <p className="text-slate-500 font-medium">개념 정리 → 퀴즈 → 퍼즐 생성 중...</p>
      </div>
    );
  }

  if (phase === 'CONCEPT' && data) {
    return (
      <div className="min-h-screen bg-indigo-50 p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-6 md:p-10 shadow-2xl border-t-8 border-indigo-500 animate-fade-in">
          <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
             <h2 className="text-2xl md:text-3xl font-black text-indigo-900 flex items-center gap-3">
               <Brain className="text-indigo-500" size={32}/> 
               <span>개념 쏙쏙 (Concept)</span>
             </h2>
             <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full text-sm">Step 1/3</span>
          </header>
          
          <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">{data.concept.title}</h3>
          
          <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-200">
            <ul className="space-y-4">
              {data.concept.summary.map((line, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-700 font-bold text-lg leading-relaxed">
                  <span className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black shrink-0 shadow-md">{i+1}</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 text-amber-900 p-6 rounded-2xl font-medium mb-8 border border-amber-100 flex items-start gap-3">
             <span className="font-black bg-amber-200 px-2 rounded text-amber-800 text-sm mt-1">예문</span>
             <span className="text-lg italic">"{data.concept.example}"</span>
          </div>

          <button onClick={() => setPhase('QUIZ')} className="w-full py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
            이해했습니다! 퀴즈 풀기 <ArrowRight/>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'QUIZ' && data) {
    const quiz = data.quizzes[quizIdx];
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center justify-center">
         <div className="w-full max-w-lg">
           <div className="mb-6 flex justify-between items-center text-slate-500 font-bold">
             <span className="flex items-center gap-2"><Zap size={18}/> 스피드 퀴즈</span>
             <span className="bg-white px-3 py-1 rounded-full shadow-sm">{quizIdx + 1} / {data.quizzes.length}</span>
           </div>
           
           <div className="bg-white rounded-3xl p-8 shadow-xl text-center animate-fade-in">
             <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-10 leading-snug break-keep">{quiz.question}</h3>
             
             <div className="grid grid-cols-1 gap-4">
               {quiz.options.map((opt) => (
                 <button 
                   key={opt}
                   onClick={() => handleQuizAnswer(opt)}
                   className="py-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xl font-bold text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-all active:scale-95 shadow-sm"
                 >
                   {opt}
                 </button>
               ))}
             </div>
           </div>
         </div>
      </div>
    );
  }

  if (phase === 'PUZZLE' && data) {
    return (
      <div className="min-h-screen bg-slate-200 p-4 flex flex-col items-center">
        <header className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center">
           <h2 className="font-bold text-slate-700 flex items-center gap-2">
             <Layers className="text-indigo-500"/> 구문 테트리스
           </h2>
           <div className={`text-sm font-bold px-4 py-2 rounded-full shadow-sm transition-colors ${isError ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-indigo-100 text-indigo-600'}`}>
             {message || (level === 'advanced' ? "⚠️ 함정(Trap) 단어가 숨어있습니다!" : "의미 단위로 순서대로 배열하세요.")}
           </div>
        </header>

        <div className="bg-white/60 backdrop-blur-sm px-8 py-4 rounded-full mb-8 shadow-sm">
           <p className="text-xl md:text-2xl font-bold text-slate-800 text-center">
             "{data.puzzle.sentence_translation}"
           </p>
        </div>

        {/* Drop Zone */}
        <div className="w-full max-w-4xl min-h-[140px] bg-white rounded-3xl shadow-inner border-4 border-slate-300 p-6 flex flex-wrap gap-3 items-center justify-center mb-10 transition-colors hover:border-slate-400">
           {placedBlocks.length === 0 && (
             <div className="text-slate-300 font-bold flex flex-col items-center gap-2">
               <ArrowRight className="rotate-90" size={32}/>
               <span>아래 블록을 터치해서 이곳으로 옮기세요</span>
             </div>
           )}
           {placedBlocks.map((block, i) => (
             <button key={`${block}-${i}`} onClick={() => handleBlockClick(block, 'placed')} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-red-500 transition-all animate-fade-in active:scale-95 text-lg">
               {block}
             </button>
           ))}
        </div>

        {/* Source Zone */}
        <div className="w-full max-w-4xl flex flex-wrap gap-4 justify-center mb-12">
           {availableBlocks.map((block, i) => (
             <button key={`${block}-${i}`} onClick={() => handleBlockClick(block, 'available')} className="bg-white text-slate-800 border-b-4 border-slate-200 px-5 py-4 rounded-2xl font-bold shadow-sm hover:border-indigo-500 hover:-translate-y-1 transition-all text-lg active:border-b-0 active:translate-y-1">
               {block}
             </button>
           ))}
        </div>

        <button onClick={checkPuzzle} className="px-16 py-5 bg-indigo-600 text-white text-2xl font-black rounded-full shadow-2xl hover:bg-indigo-700 active:scale-95 transition-transform ring-4 ring-indigo-200">
          제출하기 (Submit)
        </button>
      </div>
    );
  }

  if (phase === 'SUCCESS') {
    return (
       <div className="min-h-screen bg-green-500 flex flex-col items-center justify-center text-white p-8">
          <div className="bg-white/20 p-8 rounded-full mb-8 animate-bounce backdrop-blur-sm">
             <CheckCircle size={100} />
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter">PERFECT!</h1>
          <p className="text-2xl opacity-90 mb-12 font-medium">문법 수리를 완벽하게 마쳤습니다.</p>
          <button onClick={onBack} className="px-10 py-4 bg-white text-green-600 rounded-full font-black text-xl shadow-2xl hover:scale-105 transition-transform">
            월드맵으로 돌아가기
          </button>
       </div>
    );
  }

  return null;
};