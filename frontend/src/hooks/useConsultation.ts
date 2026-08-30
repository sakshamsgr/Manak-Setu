import { useState, useCallback } from 'react';
import { ComplianceDossier } from '../types/compliance';
import { ChatMessage } from '../types/chat';
import { sendChatMessage, sendMultimodalMessage } from '../services/api';
import { generateComplianceDossier } from '../services/complianceParser';

export function useConsultation() {
  const [activeDossier, setActiveDossier] = useState<ComplianceDossier | null>(null);
  const [followUpMessages, setFollowUpMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consultation Session ID
  const [sessionId] = useState<string>(() => `consultation_${Date.now()}`);

  /**
   * Run a new primary product compliance consultation
   */
  const startConsultation = useCallback(async (query: string, file?: File) => {
    const trimmed = query.trim();
    if (!trimmed && !file) return;

    setIsLoading(true);
    setErrorMessage(null);
    setFollowUpMessages([]);

    try {
      let response;
      if (file) {
        response = await sendMultimodalMessage(sessionId, trimmed, file);
      } else {
        response = await sendChatMessage(sessionId, trimmed);
      }

      const dossier = generateComplianceDossier(
        trimmed || (file ? `Compliance analysis for uploaded ${file.name}` : 'Product Consultation'),
        response.reply,
        response.citations,
        file?.name || response.filename
      );

      setActiveDossier(dossier);
    } catch (err: any) {
      console.error('Consultation failed:', err);
      const msg = err.message || 'Unable to connect to BIS Compliance Engine.';
      setErrorMessage(msg);

      // Create fallback dossier so the user still gets a clear, helpful UI guidance
      const fallbackDossier = generateComplianceDossier(
        trimmed,
        `?? **Connection Notice**: ${msg}\n\n*Please verify your FastAPI server is running on http://127.0.0.1:8000.*`,
        [],
        file?.name
      );
      setActiveDossier(fallbackDossier);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  /**
   * Send conversational follow-up questions within the active dossier
   */
  const sendFollowUp = useCallback(async (followUpText: string) => {
    const trimmed = followUpText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_f_${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setFollowUpMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(sessionId, trimmed);

      const assistantMsg: ChatMessage = {
        id: `assistant_f_${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        citations: response.citations,
        timestamp: Date.now(),
      };

      setFollowUpMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsgText = err.message || 'Failed to get follow-up answer.';
      const errAssistantMsg: ChatMessage = {
        id: `err_f_${Date.now()}`,
        role: 'assistant',
        content: `?? **Notice**: ${errMsgText}`,
        timestamp: Date.now(),
        isError: true,
      };
      setFollowUpMessages((prev) => [...prev, errAssistantMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading]);

  const resetConsultation = useCallback(() => {
    setActiveDossier(null);
    setFollowUpMessages([]);
    setErrorMessage(null);
  }, []);

  return {
    activeDossier,
    followUpMessages,
    isLoading,
    errorMessage,
    startConsultation,
    sendFollowUp,
    resetConsultation,
  };
}
