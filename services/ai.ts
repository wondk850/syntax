import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SentenceData, Difficulty, GrammarData, GrammarLevel } from "../types";
import { MODIFIER_TYPES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Shared schema definition for consistent parsing
const SENTENCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sentences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          tokens: { type: Type.ARRAY, items: { type: Type.STRING } },
          headNounIndex: { type: Type.INTEGER },
          mainVerbIndex: { type: Type.INTEGER },
          distractorIndices: { 
            type: Type.ARRAY, 
            items: { type: Type.INTEGER },
            description: "Indices of words that look like verbs but are not (e.g., participles, verbs inside modifiers)" 
          },
          modifiers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                startIndex: { type: Type.INTEGER },
                endIndex: { type: Type.INTEGER },
                typeCode: { type: Type.INTEGER },
              },
              required: ["startIndex", "endIndex", "typeCode"]
            }
          },
          subjectType: { type: Type.INTEGER },
          translation: { type: Type.STRING },
        },
        required: ["tokens", "headNounIndex", "mainVerbIndex", "modifiers", "translation", "subjectType"]
      }
    }
  }
};

const GRAMMAR_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    concept: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.ARRAY, items: { type: Type.STRING } },
        key_distinction: { type: Type.STRING, description: "Comparison with a confusing concept (e.g. What vs That)" },
        exam_tip: { type: Type.STRING, description: "Common mistake or trap in exams" },
        example: { type: Type.STRING },
      },
      required: ["title", "summary", "key_distinction", "exam_tip", "example"]
    },
    quizzes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          answer: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ["question", "options", "answer", "explanation"]
      }
    },
    puzzles: {
      type: Type.ARRAY,
      description: "Generate exactly 7 distinct sentence puzzles for practice",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          sentence_translation: { type: Type.STRING },
          chunks: { type: Type.ARRAY, items: { type: Type.STRING } },
          correct_order: { type: Type.ARRAY, items: { type: Type.STRING } },
          distractor: { type: Type.STRING, nullable: true },
        },
        required: ["sentence_translation", "chunks", "correct_order"]
      }
    }
  },
  required: ["concept", "quizzes", "puzzles"]
};

export const parseTextToGameData = async (text: string): Promise<SentenceData[]> => {
  const modifierList = MODIFIER_TYPES.map(m => `${m.code}:${m.fullName}`).join(", ");
  
  const prompt = `
    Analyze the following English text and convert it into a structured JSON for a grammar game.
    Input Text: "${text}"

    Task:
    1. Split the text into individual sentences.
    2. For EACH sentence:
       - Tokenize it (words/punctuation).
       - Identify the MAIN Subject Head Noun (0-based index).
       - Identify the MAIN Verb (0-based index).
       - Identify 'distractorIndices': indices of words that act as "Fake Verbs" (e.g., participles like 'made', 'playing' inside modifiers, or verbs inside relative clauses). These are TRAPS for students.
       - Identify ALL post-modifiers modifying the head noun.
       - Assign Modifier Type Code (1-17) from: [${modifierList}].
       - Provide Korean translation.
       - Assign Subject Type (1-12).

    Constraints:
    - Return valid JSON.
    - Be precise with indices.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Use Pro for higher accuracy in parsing user text
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SENTENCE_SCHEMA
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.sentences.map((s: any, idx: number) => ({
        id: `custom-${Date.now()}-${idx}`,
        tokens: s.tokens,
        headNounIndex: s.headNounIndex,
        mainVerbIndex: s.mainVerbIndex,
        distractorIndices: s.distractorIndices || [],
        modifiers: s.modifiers.map((m: any, mIdx: number) => ({
          id: `mod-${idx}-${mIdx}`,
          startIndex: m.startIndex,
          endIndex: m.endIndex,
          typeCode: m.typeCode
        })),
        subjectType: s.subjectType || 1,
        translation: s.translation,
        difficulty: 'intermediate' // Default for custom text
      }));
    }
    return [];
  } catch (e) {
    console.error("Custom Parsing Failed", e);
    throw new Error("AI가 문장을 분석하지 못했습니다. 문장이 정확한지 확인해주세요.");
  }
};

export const generateSessionSentences = async (
  difficulty: Difficulty, 
  count: number = 10,
  focusWeaknessCode?: number | null
): Promise<SentenceData[]> => {
  
  const modifierList = MODIFIER_TYPES.map(m => `${m.code}:${m.fullName}`).join(", ");
  
  let prompt = `
    Generate ${count} distinct English sentences for a grammar learning game.
    Level: ${difficulty.toUpperCase()}.
    
    Task:
    1. Provide the English sentence split into tokens.
    2. Identify MAIN Head Noun and MAIN Verb indices.
    3. Identify 'distractorIndices': indices of "Fake Verbs" (participles, verbs in sub-clauses) to test students.
    4. Identify modifiers and their type codes (1-17): [${modifierList}].
    5. Provide Korean translation.

    Constraints:
    - JSON Output.
    - Accurate indices.
    - Beginner: 1 modifier.
    - Intermediate: 1-2 modifiers.
    - Advanced: Complex structure.
  `;

  if (focusWeaknessCode) {
    prompt += `\nIMPORTANT: The user is weak at Modifier Code ${focusWeaknessCode}. Include at least 5 sentences with this modifier.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SENTENCE_SCHEMA
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      // Map to SentenceData structure with IDs
      return parsed.sentences.map((s: any, idx: number) => ({
        id: `${difficulty}-${Date.now()}-${idx}`,
        tokens: s.tokens,
        headNounIndex: s.headNounIndex,
        mainVerbIndex: s.mainVerbIndex,
        distractorIndices: s.distractorIndices || [],
        modifiers: s.modifiers.map((m: any, mIdx: number) => ({
          id: `mod-${idx}-${mIdx}`,
          startIndex: m.startIndex,
          endIndex: m.endIndex,
          typeCode: m.typeCode
        })),
        subjectType: s.subjectType || 1,
        translation: s.translation,
        difficulty: difficulty
      }));
    }
    return [];
  } catch (e) {
    console.error("AI Generation Failed", e);
    return [];
  }
};

export const analyzeDiagnosis = (history: any[], currentSessionIds: string[]): string => {
   const sessionMistakes = history.filter(h => currentSessionIds.includes(h.sentenceId) && !h.correct);
   if (sessionMistakes.length === 0) return "완벽합니다! 다음 레벨로 넘어갈 준비가 되었습니다.";
   
   const rangeErrors = sessionMistakes.filter(h => h.mistakeType === 'range').length;
   const codeErrors = sessionMistakes.filter(h => h.mistakeType === 'code').length;
   const trapErrors = sessionMistakes.filter(h => h.mistakeType === 'trap').length;

   if (trapErrors > 0) return "진짜 동사와 '가짜 동사(준동사)'를 구별하는 연습이 필요합니다. 함정에 주의하세요!";
   if (rangeErrors > codeErrors) return "수식어의 범위(어디서부터 어디까지인지)를 찾는 연습이 더 필요해 보입니다.";
   return "수식어의 종류(코드 번호)를 헷갈려하고 있습니다. 힌트 기능을 적극 활용해보세요.";
};

export const generateSpeech = async (text: string): Promise<string | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore' provides a nice, clear voice for education
            },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (e) {
    console.error("TTS Generation Failed", e);
    return undefined;
  }
};

export const generateSocraticHint = async (
  modifierText: string,
  correctCode: number,
  wrongCode: number
): Promise<string> => {
  try {
    const correctType = MODIFIER_TYPES.find(m => m.code === correctCode);
    const wrongType = MODIFIER_TYPES.find(m => m.code === wrongCode);

    const prompt = `
      The student is learning English grammar modifiers.
      Phrase: "${modifierText}"
      Correct Answer: ${correctType?.name} (Code ${correctCode})
      Student's Wrong Answer: ${wrongType?.name} (Code ${wrongCode})

      TASK: Provide a short, 1-sentence SOCRATIC QUESTION in KOREAN to guide the student.
      RULES:
      1. Do NOT reveal the correct answer directly.
      2. Do NOT say "You are wrong".
      3. Ask a question that highlights the difference between the two concepts.
      4. Example: If confused between 'Active(ing)' and 'Passive(pp)', ask "Is the noun doing the action itself, or receiving the action?"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "다시 한번 의미를 생각해보세요.";
  } catch (e) {
    return "이 문맥에서 어떤 의미가 더 자연스러운지 생각해보세요.";
  }
};

export const generateGrammarData = async (topic: string, level: GrammarLevel): Promise<GrammarData | null> => {
  // Enhanced prompt for "Desirable Difficulty" and Exam Simulation
  const prompt = `
    You are a strictly professional Korean Middle School English Exam Expert.
    Topic: '${topic}'
    Target Level: '${level}'
    
    GOAL: Create a "Desirable Difficulty" learning module. Do NOT create easy, predictable content.
    The student must struggle slightly to learn the nuance.

    Task 1: **Concept & Distinction (The "VS" Logic)**
    - Explain the topic in Korean.
    - CRITICAL: You MUST compare it with a confusing concept. (e.g., if topic is 'Rel. Pronoun What', compare it with 'Rel. Pronoun That' or 'Interrogative What').
    - 'key_distinction': Explicitly state how to tell them apart (e.g., "Complete vs Incomplete sentence").
    - 'exam_tip': A specific trick or trap to watch out for in exams.

    Task 2: **Quizzes (Discrimination Training)**
    - Create 3 distinct multiple-choice questions.
    - Options MUST include the 'confusing concept' as a distractor. 
    - Do NOT just ask definitions. Ask for judgement in context.
    - Example: If topic is 'Gerund', options should include 'Present Participle' or 'Infinitive'.
    - Explanation must explain WHY the distractor is wrong.

    Task 3: **Puzzles (Syntax Logic & Pattern Drills)**
    - Create EXACTLY 7 DIFFERENT English sentences related to the topic.
    - For each sentence, provide scrambled chunks.
    - If level == 'advanced', provide a 'distractor' word that is grammatically plausible but incorrect in this specific context (e.g., 'who' vs 'which').

    Output JSON schema:
    {
      "concept": { 
        "title": string, 
        "summary": string[], 
        "key_distinction": string, 
        "exam_tip": string, 
        "example": string 
      },
      "quizzes": [{ "question": string, "options": string[], "answer": string, "explanation": string }],
      "puzzles": [{ 
         "id": string, 
         "sentence_translation": string, 
         "chunks": string[], 
         "correct_order": string[], 
         "distractor": string | null 
      }]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: GRAMMAR_SCHEMA
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GrammarData;
    }
    return null;
  } catch (e) {
    console.error("Grammar Gen Failed", e);
    return null;
  }
};
