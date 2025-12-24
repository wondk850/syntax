import React, { useState, useEffect, useRef } from 'react';
import { GameStep, SentenceData, UserProgress, Difficulty, TutorialStep, LandfillItem, DiagnosisStats } from './types';
import { MOCK_SENTENCES, MODIFIER_TYPES } from './constants';
import { generateSessionSentences, analyzeDiagnosis, generateSpeech, generateSocraticHint } from './services/ai';
import { SentenceView } from './components/SentenceView';
import { ChatBot } from './components/ChatBot';
import { DiagnosisView } from './components/DiagnosisView';
import { TutorialOverlay } from './components/TutorialOverlay';
import { ToolsPanel } from './components/ToolsPanel';
import { Trophy, Zap, ChevronRight, RotateCcw, Layout, ArrowRight, BookOpen, AlertCircle, Loader2, TrendingUp, CheckCircle, Link, Volume2 } from 'lucide-react';

// --- Audio Helper Functions ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // Gemini 2.5 TTS returns raw PCM 24kHz mono (usually). 
  // We need to manually convert PCM to AudioBuffer because standard decodeAudioData expects headers (wav/mp3).
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert 16-bit integer (-32768 to 32767) to float (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const playSound = (type: 'pop' | 'success' | 'error' | 'click' | 'sweep' | 'connect') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    
    if (type === 'pop') {
      osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(500, now); osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'sweep') {
      osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(800, now + 0.5);
      gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'connect') {
      // Magical sound for connection
      osc.type = 'sine'; 
      osc.frequency.setValueAtTime(400, now); 
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
      gain.gain.setValueAtTime(0.1, now); 
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      osc.start(now); osc.stop(now + 0.6);
    }
  } catch (e) {}
};

const SESSION_LENGTH = 10;

const App: React.FC = () => {
  // --- Game Mode State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<Difficulty | 'landfill'>('beginner');
  const [sentenceQueue, setSentenceQueue] = useState<SentenceData[]>([]);
  const [sessionSentences, setSessionSentences] = useState<SentenceData[]>([]); // Current 10
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  // --- Progress State ---
  const [userProgress, setUserProgress] = useState<UserProgress>({
    exp: 0,
    combo: 0,
    landfill: {},
    history: [],
    tutorialCompleted: false,
    unlockedLevels: ['beginner', 'intermediate', 'advanced']
  });

  const [diagnosisStats, setDiagnosisStats] = useState<DiagnosisStats | null>(null);

  // --- Level/Game State ---
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [step, setStep] = useState<GameStep>(GameStep.HEAD_NOUN);
  const [currentModIndex, setCurrentModIndex] = useState(0);
  const [cleanedModifiers, setCleanedModifiers] = useState<number[]>([]);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);
  
  // --- Tutorial State ---
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(TutorialStep.OFF);
  
  // --- UI State ---
  const [message, setMessage] = useState<string>("");
  const [isErrorState, setIsErrorState] = useState(false);
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'tools' | 'chat'>('tools');
  const [mistakes, setMistakes] = useState({ range: 0, code: 0 });

  // --- Audio State ---
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioBuffer, setCurrentAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  
  const currentSentence = sessionSentences[currentSentenceIdx];
  const activeModifier = currentSentence?.modifiers[currentModIndex];
  
  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- Initialization ---
  useEffect(() => {
    if (!userProgress.tutorialCompleted) {
      setTutorialStep(TutorialStep.WELCOME);
    }
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // --- TTS Handler ---
  const handlePlayTTS = async () => {
    if (!currentSentence || isTTSLoading || isAudioPlaying) return;
    
    // Check if context is suspended (browser policy)
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    try {
      setIsTTSLoading(true);
      
      let buffer = currentAudioBuffer;

      // Fetch if not cached for this sentence
      if (!buffer) {
        const sentenceText = currentSentence.tokens.join(' ');
        const base64Audio = await generateSpeech(sentenceText);
        
        if (base64Audio && audioContextRef.current) {
          buffer = await decodeAudioData(
            decode(base64Audio),
            audioContextRef.current,
            24000,
            1
          );
          setCurrentAudioBuffer(buffer);
        }
      }

      if (buffer && audioContextRef.current) {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        
        source.onended = () => {
          setIsAudioPlaying(false);
          setIsTTSLoading(false);
        };
        
        setIsAudioPlaying(true);
        setIsTTSLoading(false); // Done loading, started playing
        source.start();
      } else {
        setIsTTSLoading(false); // Failed
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      setIsTTSLoading(false);
      setIsAudioPlaying(false);
    }
  };

  // Auto-play TTS on Result
  useEffect(() => {
    if (step === GameStep.RESULT) {
      setCurrentAudioBuffer(null); // Clear previous buffer
      handlePlayTTS(); // Fetch and play new one
    }
  }, [step]);


  const feedback = (msg: string, type: 'info' | 'error' | 'success') => {
    setMessage(msg);
    setIsErrorState(type === 'error');
    playSound(type === 'info' ? 'pop' : type);
  };

  const startLevel = async (level: Difficulty | 'landfill', focusCode: number | null = null) => {
    setIsAiLoading(true);
    setCurrentLevel(level);
    
    let queue: SentenceData[] = [];
    
    if (level === 'landfill') {
      const landfillIds = Object.keys(userProgress.landfill);
      queue = MOCK_SENTENCES.filter(s => landfillIds.includes(s.id)); 
      if (queue.length < 5) {
         queue = await generateSessionSentences('beginner', 5, null); 
      }
    } else {
      // AI GENERATION CALL
      queue = await generateSessionSentences(level, SESSION_LENGTH, focusCode);
      if (queue.length === 0) {
        console.warn("AI Failed, using mock");
        queue = MOCK_SENTENCES.filter(s => s.difficulty === level);
      }
    }

    setSessionSentences(queue);
    setSentenceQueue(queue); 
    setCurrentSentenceIdx(0);
    setIsPlaying(true);
    setIsAiLoading(false);
    resetSentenceState();
  };

  const resetSentenceState = () => {
    setStep(GameStep.HEAD_NOUN);
    setCurrentModIndex(0);
    setCleanedModifiers([]);
    setSelectionStart(null);
    setSelectionEnd(null);
    setMistakes({ range: 0, code: 0 });
    setMessage("주인공 명사를 찾아 터치하세요!");
    setActiveTab('tools');
    setCurrentAudioBuffer(null); // Clear audio cache

    if (tutorialStep !== TutorialStep.OFF) {
      setTutorialStep(TutorialStep.FIND_NOUN);
    }
  };

  const addToLandfill = () => {
    if (!currentSentence) return;
    setUserProgress(prev => {
      const existing = prev.landfill[currentSentence.id] || {
        sentenceId: currentSentence.id,
        wrongCode: null,
        wrongCount: 0,
        consecutiveCorrect: 0,
        lastAttempt: 0
      };
      return {
        ...prev,
        landfill: {
          ...prev.landfill,
          [currentSentence.id]: {
            ...existing,
            wrongCount: existing.wrongCount + 1,
            consecutiveCorrect: 0,
            lastAttempt: Date.now()
          }
        }
      };
    });
  };

  const handleSuccessInLandfill = () => {
    if (currentLevel !== 'landfill') return;
    setUserProgress(prev => {
      const existing = prev.landfill[currentSentence.id];
      if (!existing) return prev;

      const newConsecutive = existing.consecutiveCorrect + 1;
      const newLandfill = { ...prev.landfill };
      
      if (newConsecutive >= 2) {
        delete newLandfill[currentSentence.id]; 
      } else {
        newLandfill[currentSentence.id] = { ...existing, consecutiveCorrect: newConsecutive };
      }
      return { ...prev, landfill: newLandfill };
    });
  };

  const recordHistory = (correct: boolean, type: 'range' | 'code' | 'noun' | 'verb', code?: number) => {
    if (!currentSentence) return;
    setUserProgress(prev => ({
      ...prev,
      history: [...prev.history, {
        sentenceId: currentSentence.id,
        correct,
        mistakeType: correct ? undefined : type,
        modifierCode: code,
        timestamp: Date.now()
      }]
    }));
  };

  // --- Game Loop Handlers ---

  const handleTokenClick = (index: number) => {
    if (!currentSentence) return;

    // Tutorial Lock
    if (tutorialStep === TutorialStep.FIND_NOUN && index !== currentSentence.headNounIndex) return;
    if (tutorialStep === TutorialStep.FIND_NOUN && index === currentSentence.headNounIndex) {
      setTutorialStep(TutorialStep.QUESTION_POPUP);
    }
    if (tutorialStep === TutorialStep.FIND_VERB && index !== currentSentence.mainVerbIndex) return;


    if (step === GameStep.HEAD_NOUN) {
      if (index === currentSentence.headNounIndex) {
        setStep(GameStep.QUESTION);
        feedback("정답! 주인공을 찾았습니다.", 'success');
        recordHistory(true, 'noun');
      } else {
        feedback("이 단어는 주인공(명사)이 아닙니다.", 'error');
        setUserProgress(p => ({ ...p, combo: 0 }));
        recordHistory(false, 'noun');
      }
    } else if (step === GameStep.MODIFIER_RANGE) {
      if (selectionStart === null) {
        setSelectionStart(index);
        setMessage("이제 끝 단어를 터치하세요.");
      } else {
        const start = Math.min(selectionStart, index);
        const end = Math.max(selectionStart, index);
        setSelectionEnd(index);

        if (activeModifier && start === activeModifier.startIndex && end === activeModifier.endIndex) {
          setTimeout(() => {
            setStep(GameStep.MODIFIER_TYPE);
            setMessage("우측 패널에서 수식어 코드를 선택하세요.");
            playSound('pop');
            if (tutorialStep === TutorialStep.SELECT_RANGE) setTutorialStep(TutorialStep.SELECT_CODE);
          }, 300);
        } else {
          setTimeout(() => {
            feedback("범위가 틀렸습니다.", 'error');
            setSelectionStart(null); setSelectionEnd(null);
            setUserProgress(p => ({ ...p, combo: 0 }));
            setMistakes(prev => {
               const newR = prev.range + 1;
               if (newR >= 3) addToLandfill();
               return { ...prev, range: newR };
            });
            recordHistory(false, 'range', activeModifier?.typeCode);
          }, 400);
        }
      }
    } else if (step === GameStep.FIND_VERB) {
       // --- NEW LOGIC: FIND MAIN VERB ---
       if (index === currentSentence.mainVerbIndex) {
         feedback("완벽합니다! 주어-동사 연결 성공.", 'success');
         playSound('connect');
         recordHistory(true, 'verb');
         
         if (tutorialStep === TutorialStep.FIND_VERB) setTutorialStep(TutorialStep.COMPLETE);

         setTimeout(() => {
           setStep(GameStep.RESULT);
           handleSuccessInLandfill();
           setUserProgress(p => ({ 
             ...p, 
             exp: p.exp + 10 + (p.combo * 2), 
             combo: p.combo + 1,
           }));
           setMessage("문장 청소 완료! 구문이 한눈에 보입니다.");
         }, 800);
       } else {
          // Identify if clicked inside a cleaned modifier (common mistake)
          const inModifier = currentSentence.modifiers.some(m => index >= m.startIndex && index <= m.endIndex);
          if (inModifier) {
            feedback("그건 수식어(쓰레기) 안에 있는 동사입니다!", 'error');
          } else if (index === currentSentence.headNounIndex) {
             feedback("그건 주어입니다. 동사를 찾으세요.", 'error');
          } else {
             feedback("진짜 동사가 아닙니다.", 'error');
          }
          setUserProgress(p => ({ ...p, combo: 0 }));
          recordHistory(false, 'verb');
       }
    }
  };

  useEffect(() => {
    if (step === GameStep.QUESTION) {
      setShowQuestionPopup(true);
      setTimeout(() => {
        setShowQuestionPopup(false);
        setStep(GameStep.MODIFIER_RANGE);
        setMessage("수식어의 [시작]과 [끝] 단어를 터치하세요.");
        if (tutorialStep === TutorialStep.QUESTION_POPUP) setTutorialStep(TutorialStep.SELECT_RANGE);
      }, 1500);
    }
  }, [step]);

  const handleKeypadSelect = async (code: number) => {
    if (!activeModifier || !currentSentence) return;

    if (tutorialStep === TutorialStep.SELECT_CODE && code !== activeModifier.typeCode) return;

    if (code === activeModifier.typeCode) {
      feedback("정답! 수식어 청소 완료.", 'success');
      setCleanedModifiers(prev => [...prev, currentModIndex]);
      setSelectionStart(null); setSelectionEnd(null);
      setMistakes(prev => ({ ...prev, code: 0 }));
      recordHistory(true, 'code', code);
      playSound('sweep');

      // Check if more modifiers exist
      if (currentModIndex < currentSentence.modifiers.length - 1) {
        setTimeout(() => {
          setCurrentModIndex(prev => prev + 1);
          setStep(GameStep.MODIFIER_RANGE);
          setMessage("다음 수식어를 찾아주세요.");
        }, 800);
      } else {
        // ALL MODIFIERS CLEANED -> GO TO FIND_VERB
        setTimeout(() => {
          setStep(GameStep.FIND_VERB);
          setMessage("마지막 단계: 주어와 짝이 되는 [진짜 동사]를 찾으세요!");
          if (tutorialStep === TutorialStep.SELECT_CODE) setTutorialStep(TutorialStep.FIND_VERB);
        }, 500);
      }
    } else {
      // Wrong Answer Logic - WITH SOCRATIC HINT
      feedback("틀렸습니다. AI가 힌트를 생성 중입니다...", 'error');
      setUserProgress(p => ({ ...p, combo: 0 }));
      setMistakes(prev => {
         const newC = prev.code + 1;
         if (newC >= 2) addToLandfill();
         return { ...prev, code: newC };
      });
      recordHistory(false, 'code', activeModifier.typeCode);

      // Fetch AI Hint
      const modifierText = currentSentence.tokens.slice(activeModifier.startIndex, activeModifier.endIndex + 1).join(" ");
      try {
        const hint = await generateSocraticHint(modifierText, activeModifier.typeCode, code);
        setMessage(`🤔 AI 힌트: ${hint}`);
      } catch (e) {
        setMessage("다시 한번 차근차근 생각해보세요.");
      }
    }
  };

  const calculateDiagnosis = () => {
    const sessionIds = sessionSentences.map(s => s.id);
    const sessionHistory = userProgress.history.filter(h => sessionIds.includes(h.sentenceId));
    
    const totalAttempts = sessionHistory.length;
    const corrects = sessionHistory.filter(h => h.correct).length;
    
    // Find weakest code
    const incorrects = sessionHistory.filter(h => !h.correct && h.modifierCode);
    const codeCounts: Record<number, number> = {};
    incorrects.forEach(h => {
       if (h.modifierCode) codeCounts[h.modifierCode] = (codeCounts[h.modifierCode] || 0) + 1;
    });
    
    let weakestCode: number | null = null;
    let maxMistakes = 0;
    Object.entries(codeCounts).forEach(([code, count]) => {
      if (count > maxMistakes) {
        maxMistakes = count;
        weakestCode = Number(code);
      }
    });

    const aiFeedback = analyzeDiagnosis(userProgress.history, sessionIds);

    setDiagnosisStats({
      totalQuestions: sessionSentences.length,
      accuracy: totalAttempts > 0 ? (corrects / totalAttempts) * 100 : 0,
      weakestModifierCode: weakestCode,
      strongestModifierCode: null, // Implement if needed
      rangeErrorRate: 0,
      codeErrorRate: 0,
      feedback: aiFeedback
    });
    
    setStep(GameStep.DIAGNOSIS);
  };

  const nextSentence = () => {
    if (currentSentenceIdx < sessionSentences.length - 1) {
      setCurrentSentenceIdx(prev => prev + 1);
      resetSentenceState();
    } else {
      // END OF SESSION -> DIAGNOSIS
      calculateDiagnosis();
    }
  };

  // --- Render: Loading Screen ---
  if (isAiLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <Loader2 size={64} className="text-indigo-600 animate-spin mb-6" />
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">AI가 맞춤형 문제를 출제하고 있습니다...</h2>
        <p className="text-slate-500 mt-2">사용자의 수준과 취약점을 분석 중입니다.</p>
      </div>
    );
  }

  // --- Render: Start Screen (Level Select) ---
  if (!isPlaying) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        {tutorialStep !== TutorialStep.OFF && (
           <TutorialOverlay step={tutorialStep} onNext={() => startLevel('beginner')} onSkip={() => {
              setTutorialStep(TutorialStep.OFF);
              setUserProgress(p => ({...p, tutorialCompleted: true}));
           }} />
        )}
        
        <div className="max-w-4xl w-full">
           <header className="mb-12 text-center">
              <h1 className="text-4xl md:text-6xl font-black text-indigo-900 mb-4 tracking-tight">
                SENTENCE CLEANER <span className="text-indigo-500">PRO</span>
              </h1>
              <p className="text-xl text-slate-500">문장의 구조를 꿰뚫는 4단계 절대영문법 트레이닝</p>
           </header>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((level) => {
                 const isLocked = !userProgress.unlockedLevels.includes(level);
                 return (
                   <button 
                     key={level}
                     onClick={() => !isLocked && startLevel(level)}
                     disabled={isLocked}
                     className={`group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 shadow-xl border-2
                       ${isLocked ? 'bg-slate-200 border-slate-300 opacity-70 grayscale' : 'bg-white border-white hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-2'}
                     `}
                   >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <BookOpen size={100} />
                      </div>
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold mb-4 uppercase tracking-wider">
                        {level}
                      </span>
                      <h3 className="text-2xl font-black text-slate-800 mb-2 capitalize">{level}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-6">
                        {level === 'beginner' && "수식어 1개, 기본 구문"}
                        {level === 'intermediate' && "수식어 1~2개, 관계사절"}
                        {level === 'advanced' && "복합 수식어, 고난도 구문"}
                      </p>
                      {isLocked ? (
                        <div className="flex items-center gap-2 text-slate-400 font-bold">
                           Locked
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">
                           Start Training (10 Q) <ArrowRight size={18} />
                        </div>
                      )}
                   </button>
                 );
              })}
           </div>

           {/* Landfill Section */}
           <div className="bg-red-50 rounded-3xl p-8 border-2 border-red-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                    <AlertCircle size={32} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-red-900">오답 매립지 (Review Landfill)</h3>
                    <p className="text-red-700/80 text-sm mt-1">
                       현재 <span className="font-black text-red-600 text-lg">{Object.keys(userProgress.landfill).length}</span>개의 문장이 청소를 기다리고 있습니다.
                    </p>
                 </div>
              </div>
              <button 
                 onClick={() => startLevel('landfill')}
                 disabled={Object.keys(userProgress.landfill).length === 0}
                 className="px-8 py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                 긴급 청소 시작
              </button>
           </div>
        </div>
      </div>
    );
  }

  // --- Render: Game Dashboard ---
  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-900 font-sans overflow-hidden">
      
      {/* Tutorial Overlay */}
      <TutorialOverlay 
         step={tutorialStep} 
         onNext={() => setTutorialStep(TutorialStep.FIND_NOUN)} 
         onSkip={() => {
            setTutorialStep(TutorialStep.OFF);
            setUserProgress(p => ({...p, tutorialCompleted: true}));
         }} 
      />

      {/* 1. Left Main Stage (70%) */}
      <div className="flex-1 flex flex-col relative p-6 gap-6 overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsPlaying(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors">
                <RotateCcw size={20} />
             </button>
             <div>
                <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   {currentLevel === 'landfill' ? <span className="text-red-500">Landfill Review</span> : <span className="capitalize">{currentLevel} Session</span>}
                </h1>
                <div className="w-32 h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                   <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ width: `${(currentSentenceIdx / sessionSentences.length) * 100}%` }}
                   />
                </div>
             </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Trophy className="text-amber-500" size={24} />
               <span className="text-2xl font-black text-slate-700">{userProgress.exp}</span>
            </div>
            {userProgress.combo > 1 && (
              <div className="px-4 py-1 bg-orange-100 text-orange-600 rounded-full font-black text-lg animate-pulse">
                {userProgress.combo} COMBO
              </div>
            )}
          </div>
        </header>

        {/* Big Blackboard / Stage */}
        <main className="flex-1 bg-slate-50 rounded-3xl border border-slate-200 relative flex flex-col shadow-inner overflow-hidden">
           {/* Message Banner (Floating) */}
           <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl text-center pointer-events-none">
              <div className={`
                inline-block px-8 py-3 rounded-full text-lg font-bold shadow-lg transition-all duration-300
                ${isErrorState ? 'bg-red-500 text-white animate-shake' : step === GameStep.DIAGNOSIS ? 'hidden' : 'bg-indigo-600 text-white'}
              `}>
                {message}
              </div>
           </div>

           {/* Content */}
           <div className="flex-1 p-4 md:p-8 flex flex-col items-center justify-center overflow-y-auto">
             {step === GameStep.RESULT ? (
               <div className="text-center animate-fade-in w-full max-w-4xl flex flex-col items-center gap-8 py-8">
                  <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 px-6 py-2 rounded-full border border-green-200 shadow-sm animate-bounce">
                     <Link size={24} />
                     <span className="font-black text-xl">CONNECTED!</span>
                  </div>
                  
                  {/* Result Sentence View with S-V Connection */}
                  <div className="w-full relative">
                     <SentenceView 
                        data={currentSentence}
                        step={step}
                        currentModIndex={currentModIndex}
                        cleanedModifiers={cleanedModifiers}
                        selectionStart={selectionStart}
                        selectionEnd={selectionEnd}
                        onTokenClick={() => {}}
                        showQuestionPopup={false}
                     />

                     {/* Play Audio Button (Floating) */}
                     <button
                       onClick={handlePlayTTS}
                       disabled={isTTSLoading || isAudioPlaying}
                       className="absolute -top-12 right-0 bg-white p-3 rounded-full shadow-md border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100 z-30"
                       title="다시 듣기"
                     >
                        {isTTSLoading ? (
                          <Loader2 size={24} className="animate-spin" />
                        ) : isAudioPlaying ? (
                          <div className="flex items-center gap-1">
                             <span className="block w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite]"></span>
                             <span className="block w-1 h-5 bg-indigo-600 animate-[bounce_1.2s_infinite]"></span>
                             <span className="block w-1 h-3 bg-indigo-600 animate-[bounce_0.8s_infinite]"></span>
                          </div>
                        ) : (
                          <Volume2 size={24} />
                        )}
                     </button>
                  </div>
                  
                  <p className="text-xl md:text-2xl text-slate-600 font-medium px-4 break-keep leading-relaxed bg-white/50 py-4 rounded-xl w-full">
                    {currentSentence.translation}
                  </p>
                  
                  {/* Prominent Next Button */}
                  <button 
                     onClick={nextSentence} 
                     className="px-12 py-5 bg-indigo-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3 animate-pulse ring-4 ring-indigo-200"
                  >
                     {currentSentenceIdx < sessionSentences.length - 1 ? "다음 문장으로 이동" : "결과 리포트 보기"} <ArrowRight size={24} />
                  </button>
               </div>
             ) : step === GameStep.DIAGNOSIS && diagnosisStats ? (
                <DiagnosisView 
                   stats={diagnosisStats} 
                   onContinue={() => startLevel(currentLevel as Difficulty)}
                   onRetryWeakness={() => startLevel(currentLevel as Difficulty, diagnosisStats.weakestModifierCode)}
                   onExit={() => setIsPlaying(false)}
                />
             ) : currentSentence && (
               <div className="w-full max-w-5xl relative flex flex-col items-center">
                 {/* Play Audio Button (Floating) for Game Steps */}
                 <button
                   onClick={handlePlayTTS}
                   disabled={isTTSLoading || isAudioPlaying}
                   className="absolute -top-14 right-4 md:right-0 bg-white p-3 rounded-full shadow-md border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:scale-110 transition-all disabled:opacity-50 disabled:scale-100 z-30"
                   title="듣기"
                 >
                    {isTTSLoading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : isAudioPlaying ? (
                      <div className="flex items-center gap-1">
                         <span className="block w-1 h-3 bg-indigo-600 animate-[bounce_1s_infinite]"></span>
                         <span className="block w-1 h-5 bg-indigo-600 animate-[bounce_1.2s_infinite]"></span>
                         <span className="block w-1 h-3 bg-indigo-600 animate-[bounce_0.8s_infinite]"></span>
                      </div>
                    ) : (
                      <Volume2 size={24} />
                    )}
                 </button>

                 <SentenceView 
                   data={currentSentence}
                   step={step}
                   currentModIndex={currentModIndex}
                   cleanedModifiers={cleanedModifiers}
                   selectionStart={selectionStart}
                   selectionEnd={selectionEnd}
                   onTokenClick={handleTokenClick}
                   showQuestionPopup={showQuestionPopup}
                   tutorialHighlightIndex={tutorialStep === TutorialStep.FIND_NOUN ? currentSentence.headNounIndex : (tutorialStep === TutorialStep.FIND_VERB ? currentSentence.mainVerbIndex : null)}
                   tutorialHighlightRange={tutorialStep === TutorialStep.SELECT_RANGE && activeModifier ? { start: activeModifier.startIndex, end: activeModifier.endIndex } : null}
                 />
               </div>
             )}
           </div>
        </main>
      </div>

      {/* 2. Right Sidebar (Control Deck) (30% - fixed width) */}
      <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col z-20 shadow-2xl shrink-0">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
           <button 
             onClick={() => setActiveTab('tools')}
             className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'tools' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
             <Layout size={18} /> 도구 모음
           </button>
           <button 
             onClick={() => setActiveTab('chat')}
             className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'chat' ? 'border-indigo-600 text-indigo-600 bg-indigo-50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
           >
             <Zap size={18} /> AI 튜터
           </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 relative overflow-hidden bg-slate-50">
           
           {/* TOOLS TAB */}
           {activeTab === 'tools' && (
             <div className="h-full flex flex-col animate-fade-in">
                {step === GameStep.DIAGNOSIS ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                       <TrendingUp size={64} className="text-indigo-200 mb-4" />
                       <p className="text-slate-500 font-bold">진단 결과를 확인하고<br/>다음 학습을 선택하세요.</p>
                    </div>
                ) : (
                   <ToolsPanel 
                      step={step}
                      activeModifier={activeModifier}
                      onKeypadSelect={handleKeypadSelect}
                      onHint={() => setMessage(`힌트: ${MODIFIER_TYPES.find(m => m.code === activeModifier?.typeCode)?.hint}`)}
                      tutorialHighlightCode={tutorialStep === TutorialStep.SELECT_CODE && activeModifier ? activeModifier.typeCode : null}
                      currentLevel={currentLevel}
                   />
                )}
             </div>
           )}

           {/* CHAT TAB */}
           {activeTab === 'chat' && currentSentence && step !== GameStep.DIAGNOSIS && (
              <div className="h-full p-4 animate-fade-in">
                 <ChatBot currentSentence={currentSentence} />
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;