import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SentenceData, Difficulty } from "../types";
import { MODIFIER_TYPES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    1. Provide the English sentence split into tokens (words/punctuation).
    2. Identify the MAIN Subject Head Noun index (0-based).
    3. Identify the MAIN Verb index (0-based) that corresponds to the head noun.
    4. Identify ALL post-modifiers (adjective phrases, relative clauses, etc.) modifying that head noun.
    5. Provide the Modifier Type Code (1-17) based on this list: [${modifierList}].
    6. Provide a Korean translation.
    7. Identify Subject Type (1-12) generally.

    Constraints:
    - Return a JSON object with a "sentences" array.
    - Ensure indices are accurate for the 'tokens' array.
    - Beginner: 1 modifier max, simple vocabulary.
    - Intermediate: 1-2 modifiers, relative clauses.
    - Advanced: Complex structure, nested modifiers possible.
  `;

  if (focusWeaknessCode) {
    prompt += `\nIMPORTANT: The user is weak at Modifier Code ${focusWeaknessCode}. Please include at least 5 sentences containing this specific modifier type to help them practice.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
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
        }
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