import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { SentenceData } from '../types';

interface ChatBotProps {
  currentSentence: SentenceData;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ currentSentence }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '선생님을 도와줄 AI 조교입니다. 무엇을 도와드릴까요?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    if (!chatSessionRef.current) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const contextPrompt = `
          You are an expert English grammar assistant for a classroom setting.
          Current Sentence: "${currentSentence.tokens.join(' ')}"
          Translation: "${currentSentence.translation}"
          Head Noun: "${currentSentence.tokens[currentSentence.headNounIndex]}"
          
          Explain clearly for students. Be concise. Use formatting.
        `;
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-3-pro-preview',
          config: { systemInstruction: contextPrompt },
        });
      } catch (error) {
        setMessages(prev => [...prev, { role: 'model', text: 'API 연결 실패' }]);
      }
    }
  }, [currentSentence]);

  // Reset on sentence change
  useEffect(() => {
    setMessages([{ role: 'model', text: '문장이 바뀌었습니다. 질문 있으신가요?' }]);
    chatSessionRef.current = null;
  }, [currentSentence.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSessionRef.current || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      setMessages(prev => [...prev, { role: 'model', text: response.text || "응답 없음" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: '오류가 발생했습니다.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Sparkles size={16} className="text-indigo-500" />
        <span className="font-bold text-slate-700 text-sm">AI Class Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`
              px-3 py-2 rounded-lg text-sm max-w-[90%] leading-relaxed
              ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}
            `}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <Loader2 size={16} className="animate-spin text-slate-400 m-4" />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="문법 질문..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={isLoading} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};