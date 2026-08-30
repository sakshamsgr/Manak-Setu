import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatSession, Citation } from '../types/chat';
import { sendChatMessage, sendMultimodalMessage } from '../services/api';

const SESSIONS_STORAGE_KEY = 'bis_chat_sessions_v1';
const ACTIVE_SESSION_KEY = 'bis_active_session_id_v1';

const INITIAL_GREETING = `### Welcome to the Bureau of Indian Standards (BIS) AI Assistant
*????: ??????????: (Standards Lead the Way)*

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
    const newSession = createNewSessionObject();
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setErrorMessage(null);
    return newSession.id;
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
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
    updateActiveSessionMessages(() => [DEFAULT_WELCOME_MESSAGE]);
    setErrorMessage(null);
  }, [updateActiveSessionMessages]);

  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

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
      const response = await sendChatMessage(activeSessionId, trimmed);
      
      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        citations: response.citations,
        timestamp: Date.now(),
      };

      updateActiveSessionMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error sending chat message:', err);
      const errMsgText = err.message || 'An unexpected communication error occurred.';
      setErrorMessage(errMsgText);

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `?? **Connection Notice**: ${errMsgText}\n\n*Please ensure your FastAPI backend is running locally with \`uvicorn api_server:app --reload\` at http://127.0.0.1:8000.*`,
        timestamp: Date.now(),
        isError: true,
      };
      updateActiveSessionMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAttachment = async (userText: string, file: File) => {
    if (isLoading) return;
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
      const response = await sendMultimodalMessage(activeSessionId, userText, file);

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
      console.error('Multimodal message failed:', err);
      const errMsgText = err.message || 'Multimodal analysis failed.';
      setErrorMessage(errMsgText);

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `?? **Analysis Error**: ${errMsgText}`,
        timestamp: Date.now(),
        isError: true,
      };
      updateActiveSessionMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    if (!activeSession) return;
    const lastUserMsg = [...activeSession.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
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
