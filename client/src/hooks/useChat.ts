import { useState, useCallback, useRef } from 'react';
import { askArenaMind } from '../api/client';
import type { ChatMessage, UserRole, SupportedLanguage } from '../types';

export function useChat(role: UserRole) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const sendMessage = useCallback(
    async (text: string, language: SupportedLanguage, imageBase64?: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const response = await askArenaMind(role, text, language, sessionIdRef.current, imageBase64);
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: response.text,
          structuredCard: response.structuredCard,
          toolsUsed: response.toolsUsed,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I had trouble processing that. Please try again or ask a nearby volunteer for help.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [role],
  );

  const clearMessages = useCallback(() => setMessages([]), []);

  return { messages, isLoading, sendMessage, clearMessages };
}
