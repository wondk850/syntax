import React, { useState, useEffect } from 'react';
import { GrammarData, GrammarLevel } from '../types';
import { generateGrammarData } from '../services/ai';
import { Loader2, ArrowRight, Brain, CheckCircle, XCircle, Siren, Home, Map, Zap, Layers, AlertTriangle, Scale, X, Activity, RefreshCcw, BookOpen, GraduationCap } from 'lucide-react';

interface GrammarModeProps {
  onBack: () => void;
}

type Phase = 'TOPIC_SELECT' | 'LOADING' | 'CONCEPT' | 'QUIZ' | 'PUZZLE' | 'DIAGNOSIS' | 'SUCCESS';

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
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [data, setData] = useState<GrammarData | null>(null);
  
  // Quiz State
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [quizFeedback, setQuizFeedback] = useState<{isCorrect: boolean, text: string} | null>(null);
  const [quizMistakeCount, setQuizMistakeCount] = useState(0);

  // Puzzle State
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [placedBlocks, setPlacedBlocks] = useState<string[]>([]);
  const [availableBlocks, setAvailableBlocks] = useState<string[]>([]);
  const [puzzleFeedback, setPuzzleFeedback] = useState<{type: 'error' | 'success', text: string} | null>(null);
  const [puzzleMistakeCount, setPuzzleMistakeCount] = useState(0);

  // Stats
  const [sessionStats, setSessionStats] = useState({ quizCorrect: 0, puzzleCorrect: 0 });

  const loadTopic = async (topicLabel: string, isRetry = false) => {
    setCurrentTopic(topicLabel);
    setPhase('LOADING');
    // Pass the full label (Korean + English) to AI so it knows exactly what to teach
    const result = await generateGrammarData(topicLabel, level);
    if (result && result.puzzles && result.puzzles.length > 0) {
      setData(result);
      // Reset States
      setQuizIdx(0);
      setSelectedOptionIdx(null);
      setQuizFeedback(null);
      setPuzzleIdx(0);
      setPuzzleFeedback(null);
      setSessionStats({ quizCorrect: 0, puzzleCorrect: 0 });
      setQuizMistakeCount(0);
      setPuzzleMistakeCount(0);

      // Prepare First Puzzle
      preparePuzzle(result.puzzles[0]);

      if (isRetry) {
         setPhase('PUZZLE'); // Skip concept/quiz on retry
      } else {
         setPhase('CONCEPT');
      }
    } else {
      setPhase('TOPIC_SELECT');
      alert("AI가 수업을 준비하지 못했습니다. 다시 시도해주세요.");
    }
  };

  const preparePuzzle = (puzzle: any) => {
      const chunks = [...puzzle.chunks];
      if (puzzle.distractor) chunks.push(puzzle.distractor);
      // Shuffle
      for (let i = chunks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chunks[i], chunks[j]] = [chunks[j], chunks[i]];
      }
      setAvailableBlocks(chunks);
      setPlacedBlocks([]);
      setPuzzleFeedback(null);
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (!data) return;
    const currentQuiz = data.quizzes[quizIdx];
    const optionText = currentQuiz.options[optionIdx];
    
    setSelectedOptionIdx(optionIdx);

    if (optionText === currentQuiz.answer) {
      // CORRECT
      setQuizFeedback({ isCorrect: true, text: `정답입니다!\n${currentQuiz.final_explanation}` });
      if (quizMistakeCount === 0) {
        setSessionStats(prev => ({ ...prev, quizCorrect: prev.quizCorrect + 1 }));
      }
      
      setTimeout(() => {
        if (quizIdx < data.quizzes.length - 1) {
          setQuizIdx(prev => prev + 1);
          setQuizFeedback(null);
          setSelectedOptionIdx(null);
          setQuizMistakeCount(0);
        } else {
          setPhase('PUZZLE');
          setPuzzleFeedback(null);
        }
      }, 2500); // Give more time to read the full explanation
    } else {
      // WRONG
      setQuizMistakeCount(prev => prev + 1);
      // Show specific hint for this distractor, NOT the full explanation
      const hint = currentQuiz.distractor_hints?.[optionIdx] || "오답입니다. 다시 생각해보세요.";
      setQuizFeedback({ isCorrect: false, text: hint });
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
    setPuzzleFeedback(null);
  };

  const checkPuzzle = () => {
    if (!data) return;
    const currentPuzzle = data.puzzles[puzzleIdx];
    
    // Check for Trap
    if (currentPuzzle.distractor && placedBlocks.includes(currentPuzzle.distractor)) {
      setPuzzleMistakeCount(prev => prev + 1);
      setPuzzleFeedback({ type: 'error', text: "🚨 함정 카드 발동! 문법적으로 어색한 단어(Trap)가 섞여 있습니다." });
      return;
    }

    // Check Order
    const currentStr = placedBlocks.join(" ").replace(/\s+/g, " ").trim();
    const correctStr = currentPuzzle.correct_order.join(" ").replace(/\s+/g, " ").trim();

    if (currentStr === correctStr) {
      // Correct
      setPuzzleFeedback({ type: 'success', text: "Perfect! 다음 문장으로 넘어갑니다." });
      if (puzzleMistakeCount === 0) {
        setSessionStats(prev => ({ ...prev, puzzleCorrect: prev.puzzleCorrect + 1 }));
      }

      setTimeout(() => {
        if (puzzleIdx < data.puzzles.length - 1) {
          const nextIdx = puzzleIdx + 1;
          setPuzzleIdx(nextIdx);
          preparePuzzle(data.puzzles[nextIdx]);
          setPuzzleMistakeCount(0);
        } else {
          setPhase('DIAGNOSIS');
        }
      }, 1000);

    } else {
      setPuzzleMistakeCount(prev => prev + 1);
      setPuzzleFeedback({ type: 'error', text: "순서가 틀렸거나 블록이 부족합니다. 해석을 다시 참고하세요." });
    }
  };

  // Helper for Exit Button
  const renderExitButton = () => (
    <button 
      onClick={onBack} 
      className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full text-slate-500 hover:text-red-500 transition-colors z-50"
      title="홈으로 나가기"
    >
      <X size={24} />
    </button>
  );

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
              기본 (개념 탑재)
            </button>
            <button 
              onClick={() => setLevel('advanced')} 
              className={`px-6 py-2 rounded-full font-bold transition-all shadow-md ${level === 'advanced' ? 'bg-red-500 text-white scale-105 ring-2 ring-red-300' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
            >
              심화 (함정 & 비교)
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
        <h2 className="text-2xl font-black text-indigo-900 mb-2">AI가 '바람직한 어려움'을 생성 중입니다...</h2>
        <p className="text-slate-500 font-medium">5지선다 문제와 개념적 힌트를 준비하고 있습니다.</p>
      </div>
    );
  }

  if (phase === 'CONCEPT' && data) {
    return (
      <div className="min-h-screen bg-indigo-50 p-4 md:p-8 flex flex-col items-center justify-center relative">
        {renderExitButton()}
        <div className="max-w-2xl w-full bg-white rounded-3xl p-6 md:p-10 shadow-2xl border-t-8 border-indigo-500 animate-fade-in">
          <header className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
             <h2 className="text-2xl md:text-3xl font-black text-indigo-900 flex items-center gap-3">
               <Brain className="text-indigo-500" size={32}/> 
               <span>개념 쏙쏙 (Concept)</span>
             </h2>
             <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full text-sm">Step 1/3</span>
          </header>
          
          <h3 className="text-3xl font-black text-slate-800 mb-6 text-center">{data.concept.title}</h3>
          
          {/* Summary */}
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

          {/* VS & Traps Section (New) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <h4 className="flex items-center gap-2 font-black text-amber-600 mb-2">
                   <Scale size={20}/> 헷갈리는 포인트 (VS)
                </h4>
                <p className="text-sm font-medium text-amber-900 leading-relaxed">
                   {data.concept.key_distinction || "비슷한 개념과의 차이를 확실히 알아야 합니다."}
                </p>
             </div>
             <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h4 className="flex items-center gap-2 font-black text-red-600 mb-2">
                   <Siren size={20}/> 시험 함정 (Trap)
                </h4>
                <p className="text-sm font-medium text-red-900 leading-relaxed">
                   {data.concept.exam_tip || "시험에서는 이 부분을 바꿔서 오답을 유도합니다."}
                </p>
             </div>
          </div>

          <div className="bg-slate-800 text-white p-6 rounded-2xl font-medium mb-8 border border-slate-700 flex flex-col items-center text-center gap-2">
             <span className="font-black bg-slate-600 px-2 py-1 rounded text-xs uppercase tracking-wider">Example</span>
             <span className="text-xl italic">"{data.concept.example}"</span>
          </div>

          <button onClick={() => setPhase('QUIZ')} className="w-full py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-indigo-700 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform">
            함정 피하러 가기 (Quiz) <ArrowRight/>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'QUIZ' && data) {
    const quiz = data.quizzes[quizIdx];
    return (
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex flex-col items-center justify-center relative">
         {renderExitButton()}
         <div className="w-full max-w-2xl">
           <div className="mb-6 flex justify-between items-center text-slate-500 font-bold">
             <span className="flex items-center gap-2"><Zap size={18}/> 실전 모의고사 (5지선다)</span>
             <span className="bg-white px-3 py-1 rounded-full shadow-sm">{quizIdx + 1} / {data.quizzes.length}</span>
           </div>
           
           <div className="bg-white rounded-3xl p-8 shadow-xl text-center animate-fade-in border-b-8 border-slate-200">
             <div className="inline-block px-3 py-1 bg-red-100 text-red-600 font-black text-xs rounded-full mb-4">함정 주의</div>
             <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 leading-relaxed break-keep text-left">
               {quiz.question}
             </h3>
             
             <div className="grid grid-cols-1 gap-3 mb-6">
               {quiz.options.map((opt, idx) => (
                 <button 
                   key={idx}
                   onClick={() => handleQuizAnswer(idx)}
                   disabled={quizFeedback !== null && quizFeedback.isCorrect}
                   className={`
                     py-4 px-6 rounded-xl text-lg font-bold text-left transition-all border-2 shadow-sm flex items-center gap-3
                     ${selectedOptionIdx === idx 
                        ? (quizFeedback?.isCorrect ? 'bg-green-100 border-green-500 text-green-800' : 'bg-red-50 border-red-200 text-red-800') 
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50'}
                     disabled:opacity-70
                   `}
                 >
                   <span className="w-6 h-6 rounded-full bg-white border-2 border-current flex items-center justify-center text-xs font-black shrink-0">
                     {idx + 1}
                   </span>
                   {opt}
                 </button>
               ))}
             </div>

             {/* On-screen Feedback Area */}
             {quizFeedback && (
               <div className={`p-5 rounded-2xl border-2 animate-fade-in text-left ${quizFeedback.isCorrect ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                 <div className="flex items-center gap-2 font-black text-lg mb-2">
                   {quizFeedback.isCorrect ? <CheckCircle className="text-green-600"/> : <XCircle className="text-red-600"/>}
                   {quizFeedback.isCorrect ? "정답입니다!" : "다시 생각해보세요."}
                 </div>
                 <p className="font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {/* Socratic Hint Logic: Show hint if wrong, Full explanation if correct */}
                    {quizFeedback.isCorrect ? (
                        <span className="text-green-800">{quizFeedback.text}</span>
                    ) : (
                        <span className="text-red-800 flex items-start gap-2">
                            <Brain size={16} className="mt-1 shrink-0"/> 
                            {quizFeedback.text}
                        </span>
                    )}
                 </p>
               </div>
             )}
           </div>
         </div>
      </div>
    );
  }

  if (phase === 'PUZZLE' && data) {
    const currentPuzzle = data.puzzles[puzzleIdx];
    return (
      <div className="min-h-screen bg-slate-200 p-4 flex flex-col items-center relative">
        {renderExitButton()}
        <header className="w-full max-w-4xl bg-white p-4 rounded-xl shadow-sm mb-6 flex justify-between items-center mt-12 md:mt-0">
           <h2 className="font-bold text-slate-700 flex items-center gap-2">
             <Layers className="text-indigo-500"/> 구문 테트리스
             <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                {puzzleIdx + 1} / {data.puzzles.length}
             </span>
           </h2>
           <div className={`text-sm font-bold px-4 py-2 rounded-full shadow-sm transition-colors bg-indigo-100 text-indigo-600`}>
             {level === 'advanced' ? "⚠️ 함정(Trap) 단어가 숨어있습니다!" : "의미 단위로 순서대로 배열하세요."}
           </div>
        </header>

        <div className="bg-white/60 backdrop-blur-sm px-8 py-4 rounded-full mb-8 shadow-sm">
           <p className="text-xl md:text-2xl font-bold text-slate-800 text-center">
             "{currentPuzzle.sentence_translation}"
           </p>
        </div>

        {/* Drop Zone */}
        <div className="w-full max-w-4xl min-h-[140px] bg-white rounded-3xl shadow-inner border-4 border-slate-300 p-6 flex flex-wrap gap-3 items-center justify-center mb-6 transition-colors hover:border-slate-400">
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

        {/* Feedback Zone */}
        {puzzleFeedback && (
          <div className={`w-full max-w-4xl mb-6 p-4 rounded-xl text-center font-bold animate-fade-in border-2 ${puzzleFeedback.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
             {puzzleFeedback.text}
          </div>
        )}

        {/* Source Zone */}
        <div className="w-full max-w-4xl flex flex-wrap gap-4 justify-center mb-12">
           {availableBlocks.map((block, i) => (
             <button key={`${block}-${i}`} onClick={() => handleBlockClick(block, 'available')} className="bg-white text-slate-800 border-b-4 border-slate-200 px-5 py-4 rounded-2xl font-bold shadow-sm hover:border-indigo-500 hover:-translate-y-1 transition-all text-lg active:border-b-0 active:translate-y-1">
               {block}
             </button>
           ))}
        </div>

        <button 
           onClick={checkPuzzle} 
           disabled={puzzleFeedback?.type === 'success'}
           className="px-16 py-5 bg-indigo-600 text-white text-2xl font-black rounded-full shadow-2xl hover:bg-indigo-700 active:scale-95 transition-transform ring-4 ring-indigo-200 disabled:opacity-50"
        >
          {puzzleFeedback?.type === 'success' ? 'Good Job!' : '제출하기 (Submit)'}
        </button>
      </div>
    );
  }

  if (phase === 'DIAGNOSIS' && data) {
    const totalPuzzles = data.puzzles.length;
    const puzzleScore = Math.round((sessionStats.puzzleCorrect / totalPuzzles) * 100);
    const quizScore = Math.round((sessionStats.quizCorrect / data.quizzes.length) * 100);
    
    const isMastered = puzzleScore >= 80 && quizScore >= 70;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-8 relative">
        {renderExitButton()}
        <div className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-indigo-100 max-w-2xl w-full text-center animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
              <Activity size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-800">학습 진단 리포트</h2>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <span className="text-sm text-slate-500 font-bold uppercase block mb-1">개념 이해도 (Quiz)</span>
              <span className={`text-4xl font-black ${quizScore >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                {quizScore}%
              </span>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <span className="text-sm text-slate-500 font-bold uppercase block mb-1">구문 응용력 (Puzzle)</span>
              <span className={`text-4xl font-black ${puzzleScore >= 80 ? 'text-green-500' : 'text-red-500'}`}>
                {puzzleScore}%
              </span>
            </div>
          </div>

          {/* AI Study Guide */}
          <div className={`p-6 rounded-2xl border-l-8 mb-8 text-left ${isMastered ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'}`}>
             <h3 className={`font-bold text-lg mb-3 flex items-center gap-2 ${isMastered ? 'text-green-800' : 'text-amber-800'}`}>
               {isMastered ? <GraduationCap/> : <BookOpen/>}
               {isMastered ? "마스터 인증 완료!" : "추가 학습이 필요합니다"}
             </h3>
             
             <div className="space-y-3 text-sm font-medium leading-relaxed opacity-90">
                {isMastered ? (
                    <div>
                        <p className="mb-2">완벽하게 이해했습니다. 다음 단계로 넘어가도 좋습니다.</p>
                        <div className="bg-white/50 p-3 rounded-lg">
                            <span className="font-bold block text-green-700">추천 코스:</span>
                            {data.study_guide.next_step}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="mb-2">{data.study_guide.weakness_analysis}</p>
                        <div className="bg-white/50 p-3 rounded-lg">
                            <span className="font-bold block text-amber-700">복습 포인트:</span>
                            {data.study_guide.review_recommendation}
                        </div>
                    </div>
                )}
             </div>
          </div>

          <div className="flex flex-col gap-3">
            {!isMastered && (
                <button 
                onClick={() => loadTopic(currentTopic, true)}
                className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                <RefreshCcw size={20} />
                복습: 이 주제 다시 도전하기
                </button>
            )}
            
            <button 
              onClick={onBack}
              className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 flex items-center justify-center gap-2"
            >
              홈으로 나가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
