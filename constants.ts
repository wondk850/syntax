import { ModifierTypeDefinition, SubjectTypeDefinition, SentenceData } from './types';

// --- Critical Issue #3: Full 17 Modifier Types ---
export const MODIFIER_TYPES: ModifierTypeDefinition[] = [
  { code: 1, name: "전치사구", fullName: "Prepositional Phrase", question: "어떤?", hint: "전치사(in, on, at...)로 시작", example: "the book [on the desk]" },
  { code: 2, name: "to부정사(형)", fullName: "To-infinitive (Adj)", question: "어떤?", hint: "to + 동사 (명사 수식)", example: "the plan [to succeed]" },
  { code: 3, name: "to부정사(부)", fullName: "To-infinitive (Adv)", question: "왜/결과", hint: "to + 동사 (동사 수식)", example: "came [to see you]" },
  { code: 4, name: "현재분사", fullName: "Present Participle", question: "어떤?", hint: "~ing (능동/진행)", example: "the man [running fast]" },
  { code: 5, name: "과거분사", fullName: "Past Participle", question: "어떤?", hint: "p.p (수동/완료)", example: "the letter [written by Tom]" },
  { code: 6, name: "형용사구", fullName: "Adjective Phrase", question: "어떤?", hint: "형용사 + 전치사", example: "something [useful for you]" },
  { code: 7, name: "관계사(주)", fullName: "Rel. Pro (Subject)", question: "어떤?", hint: "who/which/that + V", example: "the man [who loves her]" },
  { code: 8, name: "관계사(목)", fullName: "Rel. Pro (Object)", question: "어떤?", hint: "명사 + [S + V]", example: "the movie [that I watched]" },
  { code: 9, name: "관계사(소)", fullName: "Rel. Pro (Possessive)", question: "어떤?", hint: "whose + 명사", example: "the man [whose car is red]" },
  { code: 10, name: "관계부사", fullName: "Relative Adverb", question: "어떤?", hint: "when/where/why/how", example: "the place [where I live]" },
  { code: 11, name: "복합관계사", fullName: "Compound Relative", question: "누구든", hint: "whoever, whatever", example: "[whatever you want]" },
  { code: 12, name: "동격 that", fullName: "Appositive That", question: "무슨?", hint: "추상명사 + that + 완전한 문장", example: "the fact [that he lied]" },
  { code: 13, name: "동격 명사", fullName: "Appositive Noun", question: "즉?", hint: "명사, 명사", example: "Seoul, [the capital]" },
  { code: 14, name: "분사구문", fullName: "Participial Construction", question: "~하면서", hint: "콤마(,) 분사구", example: "[Walking home], I saw him" },
  { code: 15, name: "관계형용사", fullName: "Relative Adjective", question: "어떤", hint: "which + 명사", example: "He failed, [which fact]..." },
  { code: 16, name: "삽입절", fullName: "Parenthetical", question: "참고로", hint: "S+V가 중간에 삽입", example: "who, [I believe], is honest" },
  { code: 17, name: "유사관계사", fullName: "Quasi-Relative", question: "그리고", hint: "as, than, but", example: "such people [as know him]" },
];

export const SUBJECT_TYPES: SubjectTypeDefinition[] = [
  { id: 1, name: "일반명사(단수)", structure: "Simple Noun (S)", agreement: "singular" },
  { id: 2, name: "일반명사(복수)", structure: "Simple Noun (P)", agreement: "plural" },
  { id: 3, name: "To부정사구", structure: "To + V", agreement: "singular" },
  { id: 4, name: "동명사구", structure: "V-ing", agreement: "singular" },
  { id: 5, name: "That절", structure: "That + S + V", agreement: "singular" },
  { id: 6, name: "What절", structure: "What + (S) + V", agreement: "singular" },
  { id: 7, name: "Whether절", structure: "Whether + S + V", agreement: "singular" },
  { id: 8, name: "의문사절", structure: "Wh- + S + V", agreement: "singular" },
  { id: 9, name: "The + 형용사", structure: "The + Adj (People)", agreement: "plural" },
  { id: 10, name: "The + 형용사(추상)", structure: "The + Adj (Abstract)", agreement: "singular" },
  { id: 11, name: "수량표현", structure: "Part of / Most of...", agreement: "varies" },
  { id: 12, name: "상관접속사", structure: "Either A or B...", agreement: "varies" },
];

export const MOCK_SENTENCES: SentenceData[] = [
  // Beginner
  {
    id: "s1",
    tokens: ["The", "boy", "running", "in", "the", "park", "is", "my", "brother."],
    headNounIndex: 1,
    mainVerbIndex: 6, // is
    modifiers: [{ id: "m1", startIndex: 2, endIndex: 5, typeCode: 4 }], // Present Participle
    subjectType: 1,
    translation: "공원에서 달리고 있는 그 소년은 나의 남동생이다.",
    difficulty: 'beginner'
  },
  {
    id: "s2",
    tokens: ["The", "cars", "made", "in", "Germany", "are", "expensive."],
    headNounIndex: 1,
    mainVerbIndex: 5, // are
    modifiers: [{ id: "m2", startIndex: 2, endIndex: 4, typeCode: 5 }], // Past Participle
    subjectType: 2,
    translation: "독일에서 만들어진 자동차들은 비싸다.",
    difficulty: 'beginner'
  },
  // Intermediate
  {
    id: "s3",
    tokens: ["The", "man", "who", "lives", "next", "door", "is", "a", "doctor."],
    headNounIndex: 1,
    mainVerbIndex: 6, // is
    modifiers: [{ id: "m3", startIndex: 2, endIndex: 5, typeCode: 7 }], // Rel. Pro (Subj)
    subjectType: 1,
    translation: "옆집에 사는 그 남자는 의사이다.",
    difficulty: 'intermediate'
  },
  {
    id: "s4",
    tokens: ["The", "fact", "that", "he", "lied", "to", "us", "surprised", "everyone."],
    headNounIndex: 1,
    mainVerbIndex: 7, // surprised
    modifiers: [{ id: "m4", startIndex: 2, endIndex: 6, typeCode: 12 }], // Appositive That
    subjectType: 5,
    translation: "그가 우리에게 거짓말을 했다는 사실은 모두를 놀라게 했다.",
    difficulty: 'intermediate'
  },
  // Advanced
  {
    id: "s5",
    tokens: ["The", "girl", "playing", "the", "piano", "which", "I", "bought", "is", "my", "daughter."],
    headNounIndex: 1,
    mainVerbIndex: 8, // is
    modifiers: [
      { id: "m5-1", startIndex: 2, endIndex: 7, typeCode: 4 }, 
    ],
    subjectType: 1,
    translation: "내가 산 피아노를 연주하고 있는 그 소녀는 내 딸이다.",
    difficulty: 'advanced'
  },
  {
    id: "s6",
    tokens: ["People", "who", "do", "not", "know", "history", "are", "destined", "to", "repeat", "it."],
    headNounIndex: 0,
    mainVerbIndex: 6, // are
    modifiers: [{ id: "m6", startIndex: 1, endIndex: 5, typeCode: 7 }],
    subjectType: 2,
    translation: "역사를 모르는 사람들은 그것을 반복할 운명이다.",
    difficulty: 'advanced'
  }
];