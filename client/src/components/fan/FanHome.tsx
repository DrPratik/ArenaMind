import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useChat } from '../../hooks/useChat';
import MatchCountdown from './MatchCountdown';
import CrowdBanner from './CrowdBanner';
import ResponseCard from './ResponseCard';
import ETicket from './ETicket';

const QUICK_CHIPS = [
  { label: '🚪 Find my gate', prompt: 'Help me find my gate' },
  { label: '🚻 Nearest restroom', prompt: 'Where is the nearest restroom?' },
  { label: '🍔 Food near me', prompt: 'What food options are near me with the shortest queue?' },
  { label: '🌐 Translate for me', prompt: 'I need help translating something' },
  { label: '♿ Wheelchair route', prompt: 'I need an accessible wheelchair route' },
  { label: '🆘 I need help', prompt: 'I need help, please connect me with assistance' },
];

export default function FanHome() {
  const { language } = useLanguage();
  const { accessibilityMode } = useAccessibility();
  const { messages, isLoading, sendMessage } = useChat('fan');
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading, scrollToBottom]);

  const handleSend = useCallback(
    async (text: string, imageBase64?: string) => {
      if (!text.trim()) return;
      setInput('');
      await sendMessage(text, language, imageBase64);
    },
    [language, sendMessage],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleChip = (prompt: string) => {
    handleSend(prompt);
  };

  // Voice input via Web Speech API
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    const recognition = new (SpeechRecognition as new () => {
      lang: string;
      interimResults: boolean;
      onresult: (event: { results: Array<Array<{ transcript: string }>> }) => void;
      onend: () => void;
      onerror: () => void;
      start: () => void;
    })();

    const langMap: Record<string, string> = {
      en: 'en-US', es: 'es-ES', pt: 'pt-BR', fr: 'fr-FR', hi: 'hi-IN', ar: 'ar-SA',
    };
    recognition.lang = langMap[language] ?? 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    setIsListening(true);
    recognition.start();
  };

  // Photo input
  const handlePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      handleSend('What do you see in this photo? Help me with this.', base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-32">
      <div className="flex justify-end">
        <button
          onClick={() => setShowTicket(!showTicket)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-sm transition-all"
        >
          <span>🎟️</span> {showTicket ? 'Hide Ticket' : 'Show Ticket'}
        </button>
      </div>

      {showTicket && <ETicket />}

      {/* Match Countdown */}
      <MatchCountdown />

      {/* Crowd Alert Banner */}
      <CrowdBanner />

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div className="space-y-3" role="log" aria-label="Chat messages" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`animate-fade-in ${msg.role === 'user' ? 'flex justify-end' : ''}`}
            >
              {msg.role === 'user' ? (
                <div className="bg-accent-blue/20 border border-accent-blue/30 rounded-2xl rounded-br-md px-4 py-3 max-w-[85%]">
                  <p className="text-sm text-white">{msg.text}</p>
                </div>
              ) : (
                <ResponseCard message={msg} />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="glass-card p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-accent-blue animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-accent-emerald animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-white/50">ArenaMind is thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* Quick Chips (shown when no messages) */}
      {messages.length === 0 && (
        <div className="space-y-6 animate-slide-up">
          <div className="text-center py-6">
            <h2 className="text-2xl sm:text-3xl font-bold gradient-text mb-2">
              Welcome to ArenaMind
            </h2>
            <p className="text-sm text-white/50">
              Your AI stadium companion • FIFA World Cup 2026
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Quick actions">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip.prompt}
                className="quick-chip"
                onClick={() => handleChip(chip.prompt)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area — Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy-900/95 backdrop-blur-xl border-t border-white/5 p-4 z-40">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex items-center gap-3">
          {/* Photo Button */}
          <button
            type="button"
            onClick={handlePhoto}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Attach photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

          {/* Text Input */}
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={accessibilityMode ? 'Type your question here...' : 'Ask ArenaMind anything...'}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
            disabled={isLoading}
          />

          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`mic-button flex-shrink-0 ${isListening ? 'listening' : ''}`}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-full bg-accent-blue text-white disabled:opacity-30 hover:bg-accent-blue/80 transition-all flex-shrink-0"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
