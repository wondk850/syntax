export enum GameStep {
  LOADING = 0,        // AI 생성 중
  HEAD_NOUN = 1,      // 1단계: 명사 찾기
  QUESTION = 2,       // 2단계: "어떤?" 질문 (Auto)
  MODIFIER_RANGE = 3, // 3-A단계: 수식어 범위 지정 (Start -> End)
  MODIFIER_TYPE = 4,  // 3-B단계: 수식어 코드 입력
  FIND_VERB = 5,      // 4단계(New): 진짜 동사 찾기 (S-V 연결)
  RESULT = 6,         // 결과 화면 (개별 문제) - S-V 연결 확인
  DIAGNOSIS = 7,      // 10문제 종료 후 진단 리포트
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Modifier {
  id: string;
  startIndex: number;
  endIndex: number;
  typeCode: number;
}

export interface SentenceData {
  id: string;
  tokens: string[];
  headNounIndex: number;
  mainVerbIndex: number; // New: Verb Index for S-V Connection
  modifiers: Modifier[]; // Ordered left-to-right
  subjectType: number; // Linked to SubjectType ID
  translation: string;
  difficulty: Difficulty;
}

export interface ModifierTypeDefinition {
  code: number;
  name: string; // Short name for button
  fullName: string; // Full grammatical name
  question: string;
  hint: string;
  example: string;
}

export interface SubjectTypeDefinition {
  id: number;
  name: string;
  structure: string;
  agreement: 'singular' | 'plural' | 'varies';
}

export interface LandfillItem {
  sentenceId: string;
  wrongCode: number | null;
  wrongCount: number;
  consecutiveCorrect: number; // 2회 연속 정답 시 삭제
  lastAttempt: number;
}

export interface UserProgress {
  exp: number;
  combo: number;
  landfill: Record<string, LandfillItem>;
  history: { 
    sentenceId: string; 
    correct: boolean; 
    mistakeType?: 'range' | 'code' | 'noun' | 'verb';
    modifierCode?: number;
    timestamp: number 
  }[];
  tutorialCompleted: boolean;
  unlockedLevels: Difficulty[];
}

export enum TutorialStep {
  WELCOME = 0,
  FIND_NOUN = 1,
  QUESTION_POPUP = 2,
  SELECT_RANGE = 3,
  SELECT_CODE = 4,
  FIND_VERB = 5,
  COMPLETE = 6,
  OFF = -1
}

export interface DiagnosisStats {
  totalQuestions: number;
  accuracy: number;
  weakestModifierCode: number | null;
  strongestModifierCode: number | null;
  rangeErrorRate: number;
  codeErrorRate: number;
  feedback: string;
}