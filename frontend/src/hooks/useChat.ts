import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, ChatSession, Citation } from '../types/chat';
import { sendChatMessage, sendMultimodalMessage, translateChatMessages, ApiTimeoutError } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const SESSIONS_STORAGE_KEY = 'bis_chat_sessions_v1';
const ACTIVE_SESSION_KEY = 'bis_active_session_id_v1';

export const INITIAL_GREETINGS: Record<string, string> = {
  en: `### Welcome to the Bureau of Indian Standards (BIS) AI Assistant
*मानकः पथप्रदर्शकः (Standards Lead the Way)*

I am your official AI compliance and standards advisor. I can help you with:
- **Finding Applicable Standards:** e.g., Drinking Water (*IS 10500*), Electrical Safety (*IS 302*), Cement (*IS 1489*), Plugs & Sockets (*IS 1293*).
- **Product Certification (ISI Mark):** Scheme-I licensing steps, factory inspection requirements, and surveillance testing.
- **Compulsory Registration Scheme (CRS):** Scheme-II requirements for IT & electronics hardware.
- **Fee Concessions & Subsidies:** 50% discount rules for Micro Enterprises and DPIIT-recognized startups.
- **Hallmarking & Lab Testing:** BIS recognized laboratory directory and assaying standards.

*How can I assist your organization today?*`,
  hi: `### भारतीय मानक ब्यूरो (BIS) एआई सहायक में आपका स्वागत है
*मानकः पथप्रदर्शकः (मानक राह दिखाते हैं)*

मैं आपका आधिकारिक एआई अनुपालन और मानक सलाहकार हूँ। मैं आपकी सहायता कर सकता हूँ:
- **लागू मानक ढूँढना:** जैसे, पीने का पानी (*IS 10500*), विद्युत सुरक्षा (*IS 302*), सीमेंट (*IS 1489*), प्लग और सॉकेट (*IS 1293*)।
- **उत्पाद प्रमाणन (ISI मार्क):** Scheme-I लाइसेंसिंग चरण, कारखाना निरीक्षण आवश्यकताएं, और निगरानी परीक्षण।
- **अनिवार्य पंजीकरण योजना (CRS):** आईटी और इलेक्ट्रॉनिक्स हार्डवेयर के लिए Scheme-II आवश्यकताएं।
- **शुल्क रियायतें और सब्सिडी:** सूक्ष्म उद्यमों (Micro Enterprises) और DPIIT-मान्यता प्राप्त स्टार्टअप्स के लिए 50% छूट नियम।
- **हॉलमार्किंग और प्रयोगशाला परीक्षण:** BIS मान्यता प्राप्त प्रयोगशाला निर्देशिका और परख मानक।

*आज मैं आपके संगठन की क्या सहायता कर सकता हूँ?*`,
  bn: `### ভারতীয় মানক ব্যুরো (BIS) এআই সহকারী-তে স্বাগতম
*মানকঃ পথপ্রদর্শকঃ (মানক পথ দেখায়)*

আমি আপনার অফিসিয়াল এআই কমপ্লায়েন্স এবং স্ট্যান্ডার্ডস উপদেষ্টা। আমি আপনাকে সাহায্য করতে পারি:
- **প্রযোজ্য মানক সন্ধান:** যেমন, পানীয় জল (*IS 10500*), বৈদ্যুতিক নিরাপত্তা (*IS 302*), সিমেন্ট (*IS 1489*), প্লাগ ও সকেট (*IS 1293*)।
- **পণ্য সার্টিফিকেশন (ISI মার্ক):** Scheme-I লাইসেন্সিং ধাপ, কারখানা পরিদর্শন প্রয়োজনীয়তা, এবং নজরদারি পরীক্ষা।
- **বাধ্যতামূলক নিবন্ধন প্রকল্প (CRS):** আইটি ও ইলেকট্রনিক্স হার্ডওয়্যারের জন্য Scheme-II প্রয়োজনীয়তা।
- **ফি রেয়াত ও ভর্তুকি:** ক্ষুদ্র উদ্যোগ (Micro Enterprises) এবং DPIIT-স্বীকৃত স্টার্টআপের জন্য 50% ছাড়ের নিয়ম।
- **হলমার্কিং এবং ল্যাব পরীক্ষা:** BIS স্বীকৃত পরীক্ষাগার ডিরেক্টরি এবং পরখ মানক।

*আজ আমি আপনার সংস্থাকে কীভাবে সাহায্য করতে পারি?*`,
};

export const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg_welcome',
  role: 'assistant',
  content: INITIAL_GREETINGS.en,
  originalLanguage: 'en',
  translations: {
    en: INITIAL_GREETINGS.en,
    hi: INITIAL_GREETINGS.hi,
    bn: INITIAL_GREETINGS.bn,
  },
  timestamp: Date.now(),
  citations: [
    {
      document: 'BIS Act 2016 & Conformity Assessment Regulations',
      title: 'BIS Act 2016 & Conformity Assessment Regulations',
      document_title: 'BIS Act 2016 & Conformity Assessment Regulations',
      page: 1,
      page_number: 1,
      text: 'Bureau of Indian Standards is the National Standards Body of India established under the BIS Act 2016 for the harmonious development of standardisation and quality certification.',
      url: 'https://www.bis.gov.in/the-bureau/bis-act-rules-and-regulations/',
      source_url: 'https://www.bis.gov.in/the-bureau/bis-act-rules-and-regulations/'
    }
  ]
};

function createNewSessionObject(id?: string, title?: string): ChatSession {
  const sessionId = id || `web_user_${Date.now()}`;
  return {
    id: sessionId,
    title: title || 'New Consultation',
    messages: [{ ...DEFAULT_WELCOME_MESSAGE }],
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
  const [isTranslatingHistory, setIsTranslatingHistory] = useState(false);
  const prevLangRef = useRef(language);
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

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

  // Language switch effect: Translate existing history to target language non-destructively
  useEffect(() => {
    // 1. Ensure all msg_welcome messages across sessions have latest localized greetings
    setSessions((prevSessions) =>
      prevSessions.map((session) => ({
        ...session,
        messages: session.messages.map((m) => {
          if (m.id === 'msg_welcome') {
            return {
              ...m,
              translations: {
                ...INITIAL_GREETINGS,
                ...(m.translations || {}),
              },
            };
          }
          return m;
        }),
      }))
    );

    // If language hasn't changed, do nothing
    if (prevLangRef.current === language) {
      return;
    }
    prevLangRef.current = language;

    // Find active session from ref
    const currentSession = sessionsRef.current.find((s) => s.id === activeSessionId);
    if (!currentSession) return;

    // 2. Identify messages in the active session that do NOT have a translation for the selected language
    const currentMsgs = currentSession.messages;
    const needTranslation = currentMsgs.filter(
      (m) =>
        m.id !== 'msg_welcome' &&
        !m.isError &&
        m.content &&
        (!m.translations || !m.translations[language])
    );

    if (needTranslation.length === 0) return;

    let isCancelled = false;
    setIsTranslatingHistory(true);

    const translateMessages = async () => {
      try {
        const texts = needTranslation.map((m) => m.content);
        const translated = await translateChatMessages({
          texts,
          target_language: language,
          source_language: 'auto',
        });

        if (isCancelled) return;

        if (translated && translated.length === needTranslation.length) {
          updateActiveSessionMessages((prev) =>
            prev.map((msg) => {
              const idx = needTranslation.findIndex((m) => m.id === msg.id);
              if (idx !== -1 && translated[idx]) {
                return {
                  ...msg,
                  translations: {
                    ...(msg.translations || {}),
                    [language]: translated[idx],
                  },
                };
              }
              return msg;
            })
          );
        }
      } catch (err) {
        console.warn('Chat history translation failed/skipped:', err);
      } finally {
        if (!isCancelled) {
          setIsTranslatingHistory(false);
        }
      }
    };

    translateMessages();

    return () => {
      isCancelled = true;
    };
  }, [language, activeSessionId, updateActiveSessionMessages]);

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
    updateActiveSessionMessages(() => [{ ...DEFAULT_WELCOME_MESSAGE }]);
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
      originalLanguage: language,
      translations: {
        [language]: trimmed,
      },
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
        originalLanguage: language,
        translations: {
          [language]: response.reply,
        },
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
      originalLanguage: language,
      translations: {
        [language]: userText || `[Attached: ${file.name}]`,
      },
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
        originalLanguage: language,
        translations: {
          [language]: response.reply,
        },
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
    isTranslatingHistory,
    errorMessage,
    sendMessage,
    sendAttachment,
    retryLastMessage,
  };
}
