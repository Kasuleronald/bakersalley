
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const QUICK_ACTIONS = [
  { label: 'Audit Margins', prompt: 'Analyze my current SKU margins and identify the lowest performers.' },
  { label: 'Stock Alert', prompt: 'Which ingredients are below their reorder levels right now?' },
  { label: 'Fuel Strategy', prompt: 'Compare the cost benefit of switching from electric to firewood for high-volume bread.' },
  { label: 'Collection Plan', prompt: 'Which customers have the oldest outstanding debt and what is the total risk?' }
];

const FloatingAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'text' | 'live'>('text');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I'm your BakersAlley Assistant. How can I help you with your bakery operations today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Live API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // --- Utility Functions for Audio ---
  const decodeBase64 = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encodeBase64 = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  function createPcmBlob(data: Float32Array): { data: string; mimeType: string } {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  // --- Text Chat Logic with Auto-Response Streaming ---
  const handleSendMessage = async (customPrompt?: string) => {
    const messageText = customPrompt || inputText;
    if (!messageText.trim()) return;
    
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const stream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: messageText,
        config: {
          systemInstruction: "You are a world-class industrial bakery consultant for BakersAlley. Help the user with recipes, financial ratios, supply chain planning, and machinery maintenance. Keep answers professional, data-driven, and concise. Format your answers with markdown where appropriate (bolding, lists)."
        }
      });

      let fullResponseText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);
      setIsTyping(false);

      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponseText += chunk.text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'model', text: fullResponseText };
            return newMessages;
          });
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Error connecting to strategic hub. Please verify your connection." }]);
      setIsTyping(false);
    }
  };

  // --- Live Voice Logic ---
  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputNodeRef.current = audioContextRef.current.createGain();
      outputNodeRef.current.connect(audioContextRef.current.destination);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current && outputNodeRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNodeRef.current);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Live Hub Error", e),
          onclose: () => setIsLiveActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are a real-time hands-free voice assistant for a bakery floor supervisor. Speak concisely and helpfully."
        }
      });
    } catch (e) {
      console.error(e);
      alert("Microphone access is required for Live Mode.");
    }
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
      {isOpen && (
        <div className="w-[380px] h-[600px] bg-white/95 backdrop-blur-xl border border-coffee-100 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-softFade mb-4 ring-1 ring-black/5">
          {/* Header */}
          <div className="bg-coffee-900 p-6 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-lg animate-pulse">✨</div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-tight">AI Concierge</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLiveActive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'}`}></div>
                  <span className="text-[8px] font-black text-coffee-300 uppercase tracking-widest">{isLiveActive ? 'Voice Stream Active' : 'Neural Core Online'}</span>
                </div>
              </div>
            </div>
            <button onClick={() => { stopLiveSession(); setIsOpen(false); }} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/20 transition-all">✕</button>
          </div>

          {/* Mode Selector */}
          <div className="flex bg-coffee-50 p-1 mx-6 mt-4 rounded-2xl border border-coffee-100 shrink-0">
            <button 
              onClick={() => { stopLiveSession(); setMode('text'); }} 
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'text' ? 'bg-white text-coffee-900 shadow-sm' : 'text-coffee-400'}`}
            >
              Text Chat
            </button>
            <button 
              onClick={() => setMode('live')} 
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'live' ? 'bg-indigo-900 text-white shadow-sm' : 'text-coffee-400'}`}
            >
              Live Voice 🎙️
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col p-6">
            {mode === 'text' ? (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                        m.role === 'user' ? 'bg-coffee-900 text-white rounded-br-none shadow-md' : 'bg-coffee-50 text-coffee-950 rounded-bl-none border border-coffee-100'
                      }`}>
                        {m.text || <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 bg-coffee-300 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-coffee-300 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-coffee-300 rounded-full animate-bounce [animation-delay:0.4s]"></div></div>}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-coffee-50 p-4 rounded-3xl animate-pulse border border-coffee-100">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-coffee-300 rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-coffee-300 rounded-full"></div>
                          <div className="w-1.5 h-1.5 bg-coffee-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Auto-Response Chips */}
                <div className="py-4 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 -mx-1 px-1">
                  {QUICK_ACTIONS.map((action, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSendMessage(action.prompt)}
                      className="whitespace-nowrap px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl text-[9px] font-black uppercase border border-indigo-100 hover:bg-indigo-900 hover:text-white transition-all shadow-sm"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex gap-2 shrink-0">
                  <input 
                    className="flex-1 bg-slate-50 border border-slate-100 px-5 py-4 rounded-[2rem] text-sm font-medium outline-none focus:ring-2 focus:ring-coffee-500 transition-all shadow-inner" 
                    placeholder="Describe your operational issue..." 
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button onClick={() => handleSendMessage()} className="w-14 h-14 bg-coffee-900 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-black active:scale-90 transition-all">↑</button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 animate-fadeIn">
                <div className="relative">
                   {isLiveActive && (
                     <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping scale-[2]"></div>
                   )}
                   <div className={`w-40 h-40 rounded-full flex items-center justify-center text-6xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-700 ${isLiveActive ? 'bg-indigo-900 text-white scale-110' : 'bg-slate-50 text-slate-200 border border-slate-100'}`}>
                      {isLiveActive ? '🎙️' : '🔇'}
                   </div>
                </div>
                <div className="space-y-3 px-10">
                  <h4 className="text-2xl font-bold font-serif text-coffee-900">
                    {isLiveActive ? 'Voice Pulse Active' : 'Hands-Free Link'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    "Talk to Gemini about real-time production drift or resource gaps while on the floor."
                  </p>
                </div>
                <button 
                  onClick={isLiveActive ? stopLiveSession : startLiveSession}
                  className={`px-12 py-5 rounded-[2.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${isLiveActive ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' : 'bg-indigo-900 text-white hover:bg-black'}`}
                >
                  {isLiveActive ? 'Kill Audio Sync' : 'Initiate Voice Pilot'}
                </button>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 text-center border-t border-coffee-50 shrink-0">
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">BakersAlley Intelligence v3.2 • Unified Strategic Engine</span>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 border-2 ${isOpen ? 'bg-white text-coffee-900 rotate-90 border-coffee-100' : 'bg-coffee-900 text-white border-coffee-950'}`}
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
};

export default FloatingAssistant;
