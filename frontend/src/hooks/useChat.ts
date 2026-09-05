import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatSession, Citation } from '../types/chat';
import { sendChatMessage, sendMultimodalMessage, ApiTimeoutError } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const SESSIONS_STORAGE_KEY = 'bis_chat_sessions_v1';
const ACTIVE_SESSION_KEY = 'bis_active_session_id_v1';

const INITIAL_GREETING = `### Welcome to the Bureau of Indian Standards (BIS) AI Assistant
*मानकः पथप्रदर्शकः (Standards Lead the Way)*

I am your official AI compliance and standards advisor. I can help you with:
- **Finding Applicable Standards:** e.g., Drinking Water (*IS 10500*), Electrical Safety (*IS 302*), Cement (*IS 1489*), Plugs & Sockets (*IS 1293*).
- **Product Certification (ISI Mark):** Scheme-I licensing steps, factory inspection requirements, and surveillance testing.
- **Compulsory Registration Scheme (CRS):** Scheme-II requirements for IT & electronics hardware.
- **Fee Concessions & Subsidies:** 50% discount rules for Micro Enterprises and DPIIT-recognized startups.
- **Hallmarking & Lab Testing:** BIS recognized laboratory directory and assaying standards.

*How can I assist your organization today?*`;

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg_welcome',
  role: 'assistant',
  content: INITIAL_GREETING,
  timestamp: Date.now(),
  citations: [
    {
      document: 'BIS Act 2016 & Conformity Assessment Regulations',
      page: 1,
      text: 'Bureau of Indian Standards is the National Standards Body of India established under the BIS Act 2016 for the harmonious development of standardisation and quality certification.',
    }
  ]
};

function createNewSessionObject(id?: string, title?: string): ChatSession {
  const sessionId = id || `web_user_${Date.now()}`;
  return {
    id: sessionId,
    title: title || 'New Consultation',
    messages: [DEFAULT_WELCOME_MESSAGE],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useChat() {
  const { language, t } = useLanguage();
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved sessions from localStorage:', e);
    }
    return [createNewSessionObject('web_user_1', 'General BIS Inquiry')];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (saved) return saved;
    } catch {}
    return 'web_user_1';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
    } catch (e) {}
  }, [activeSessionId]);

  // Clean up any in-flight request on unmount
  useEffect(() => {
    return () => {
      activeAbortControllerRef.current?.abort();
    };
  }, []);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const updateActiveSessionMessages = useCallback((updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setSessions((prevSessions) => {
      return prevSessions.map((session) => {
        if (session.id === activeSessionId) {
          const updatedMessages = updater(session.messages);
          // Update title dynamically from first user message if default
          let title = session.title;
          if (session.title === 'New Consultation' || session.title === 'General BIS Inquiry') {
            const firstUserMsg = updatedMessages.find(m => m.role === 'user');
            if (firstUserMsg) {
              title = firstUserMsg.content.slice(0, 32) + (firstUserMsg.content.length > 32 ? '...' : '');
            }
          }
          return {
            ...session,
            title,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        }
        return session;
      });
    });
  }, [activeSessionId]);

  const createNewSession = useCallback(() => {
    activeAbortControllerRef.current?.abort();
    const newSession = createNewSessionObject();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setErrorMessage(null);
    return newSession.id;
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    activeAbortControllerRef.current?.abort();
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== sessionId);
      if (filtered.length === 0) {
        const fresh = createNewSessionObject('web_user_1', 'General BIS Inquiry');
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSessionId]);

  const clearCurrentMessages = useCallback(() => {
    activeAbortControllerRef.current?.abort();
    updateActiveSessionMessages(() => [DEFAULT_WELCOME_MESSAGE]);
    setErrorMessage(null);
  }, [updateActiveSessionMessages]);

  const sendMessage = async (userText: string, context?: Record<string, any>) => {
    const trimmed = userText.trim();
    // Rule 9: Prevent duplicate in-flight requests
    if (!trimmed || isLoading) return;

    // Abort previous in-flight request if any
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    setErrorMessage(null);
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    updateActiveSessionMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        activeSessionId, 
        trimmed, 
        language, 
        context, 
        controller.signal
      );
      
      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        citations: response.citations,
        timestamp: Date.now(),
      };

      updateActiveSessionMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError' && !err.isTimeout) {
        // Request was intentionally cancelled (e.g. user retried or sent fresh request)
        return;
      }
      console.error('Error sending chat message:', err);

      const isTimeout = err instanceof ApiTimeoutError || err.name === 'ApiTimeoutError' || err.isTimeout;
      const fallbackNotice = isTimeout
        ? t('common.aiTimeout')
        : t('common.apiUnavailable');

      setErrorMessage(fallbackNotice);

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **${fallbackNotice}**`,
        timestamp: Date.now(),
        isError: true,
        isTimeout: Boolean(isTimeout),
        canRetry: true,
      };
      updateActiveSessionMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      activeAbortControllerRef.current = null;
    }
  };

  const sendAttachment = async (userText: string, file: File) => {
    // Rule 9: Prevent duplicate submissions
    if (isLoading) return;

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    setErrorMessage(null);

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: userText || `[Attached: ${file.name}]`,
      attachmentName: file.name,
      timestamp: Date.now(),
    };

    updateActiveSessionMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendMultimodalMessage(
        activeSessionId, 
        userText, 
        file, 
        language, 
        controller.signal
      );

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        citations: response.citations,
        attachmentName: response.filename || file.name,
        timestamp: Date.now(),
      };

      updateActiveSessionMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      if (err.name === 'AbortError' && !err.isTimeout) {
        return;
      }
      console.error('Multimodal message failed:', err);

      const isTimeout = err instanceof ApiTimeoutError || err.name === 'ApiTimeoutError' || err.isTimeout;
      const fallbackNotice = isTimeout
        ? t('common.aiTimeout')
        : t('common.apiUnavailable');

      setErrorMessage(fallbackNotice);

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **${fallbackNotice}**`,
        timestamp: Date.now(),
        isError: true,
        isTimeout: Boolean(isTimeout),
        canRetry: true,
      };
      updateActiveSessionMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      activeAbortControllerRef.current = null;
    }
  };

  const retryLastMessage = () => {
    if (!activeSession) return;
    const lastUserMsg = [...activeSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove trailing error message before retrying
      updateActiveSessionMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.isError) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      sendMessage(lastUserMsg.content);
    }
  };

  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    deleteSession,
    clearCurrentMessages,
    messages: activeSession?.messages || [],
    isLoading,
    errorMessage,
    sendMessage,
    sendAttachment,
    retryLastMessage,
  };
}
