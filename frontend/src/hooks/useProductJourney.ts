import { useState, useCallback } from 'react';
import { ProductCertificationGuideData } from '../types/compliance';
import { Citation } from '../types/chat';
import { sendChatMessage, sendMultimodalMessage } from '../services/api';
import { generateProductCertificationGuideData } from '../services/complianceParser';
import { useLanguage } from '../context/LanguageContext';

export function useProductJourney() {
  const { language } = useLanguage();
  const [guideData, setGuideData] = useState<ProductCertificationGuideData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [sessionId] = useState<string>(() => `journey_${Date.now()}`);

  /**
   * Start 6-stage Product Certification Guide from user query
   */
  const startJourney = useCallback(async (query: string, file?: File) => {
    const trimmed = query.trim();
    if (!trimmed && !file) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let response;
      if (file) {
        response = await sendMultimodalMessage(sessionId, trimmed, file, language);
      } else {
        response = await sendChatMessage(sessionId, trimmed, language);
      }

      const parsedData = generateProductCertificationGuideData(
        trimmed || (file ? `Compliance analysis for ${file.name}` : 'Product Consultation'),
        response.reply,
        response.citations,
        file?.name || response.filename
      );

      setGuideData(parsedData);
    } catch (err: any) {
      console.error('Failed to start product certification guide:', err);
      const msg = err.message || 'Unable to connect to BIS Compliance Engine.';
      setErrorMessage(msg);

      // Graceful fallback so user can still navigate the guide
      const fallbackData = generateProductCertificationGuideData(
        trimmed,
        `⚠️ **Notice**: ${msg}\n\n*Please ensure your FastAPI server is running on http://127.0.0.1:8000.*`,
        [],
        file?.name
      );
      setGuideData(fallbackData);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, language]);

  /**
   * Contextual AI question handler within any step
   */
  const askContextualAI = useCallback(async (contextualQuestion: string): Promise<{ reply: string; citations: Citation[] }> => {
    const res = await sendChatMessage(sessionId, contextualQuestion, language);
    return {
      reply: res.reply,
      citations: res.citations || [],
    };
  }, [sessionId, language]);

  const resetJourney = useCallback(() => {
    setGuideData(null);
    setErrorMessage(null);
  }, []);

  return {
    guideData,
    isLoading,
    errorMessage,
    startJourney,
    askContextualAI,
    resetJourney,
  };
}
