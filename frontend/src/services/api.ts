import { ChatRequestPayload, RawBackendResponse, ChatNormalizedResponse, Citation } from '../types/chat';

/**
 * Bureau of Indian Standards API Configuration
 * Defaults to direct FastAPI local backend URL http://127.0.0.1:8000
 * Falls back to /api or Vite proxy if direct cross-origin is restricted.
 */
const DIRECT_BACKEND_URL = 'http://127.0.0.1:8000';
const PROXY_BACKEND_URL = '/api';

/**
 * Determine best available API endpoint URL
 */
export function getApiBaseUrl(): string {
  // If user configured VITE_API_BASE_URL env var, prioritize it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL as string;
  }
  return DIRECT_BACKEND_URL;
}

/**
 * Normalizes backend responses from either {reply, citations} or {response, citations}
 */
export function normalizeChatResponse(data: RawBackendResponse): ChatNormalizedResponse {
  const replyText = data.reply || data.response || 'No response text received from standard RAG engine.';
  
  const rawCitations = Array.isArray(data.citations) ? data.citations : [];
  const normalizedCitations: Citation[] = rawCitations.map((item) => {
    const document = item.document || item.standard_id || 'Indian Standard (BIS)';
    const page = item.page ?? item.page_number ?? 1;
    const text = item.text || item.content || '';
    const distance = item.distance;
    return {
      document,
      page,
      text,
      distance,
      standard_id: document,
      page_number: page,
    };
  });

  return {
    reply: replyText,
    citations: normalizedCitations,
    filename: data.filename,
  };
}

/**
 * Core Chat API Call
 * POST /chat
 * Body: { "session_id": string, "message": string }
 */
export async function sendChatMessage(
  sessionId: string, 
  message: string
): Promise<ChatNormalizedResponse> {
  const payload: ChatRequestPayload = {
    session_id: sessionId,
    message: message.trim(),
  };

  const primaryUrl = `${getApiBaseUrl()}/chat`;
  const fallbackUrl = `${PROXY_BACKEND_URL}/chat`;

  try {
    // Attempt 1: Direct request to backend
    const response = await fetch(primaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorDetail = await response.text().catch(() => 'Server error');
      throw new Error(`Server returned error ${response.status}: ${errorDetail}`);
    }

    const data: RawBackendResponse = await response.json();
    return normalizeChatResponse(data);
  } catch (directErr: any) {
    console.warn(`[BIS API Client] Direct call to ${primaryUrl} failed. Trying proxy fallback...`, directErr);

    // Attempt 2: Try Vite Proxy fallback if direct fetch had CORS / network block
    try {
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!fallbackResponse.ok) {
        const errorDetail = await fallbackResponse.text().catch(() => 'Proxy error');
        throw new Error(`Proxy error ${fallbackResponse.status}: ${errorDetail}`);
      }

      const fallbackData: RawBackendResponse = await fallbackResponse.json();
      return normalizeChatResponse(fallbackData);
    } catch (fallbackErr: any) {
      console.error('[BIS API Client] Both direct and proxy endpoints failed:', fallbackErr);
      throw new Error(
        `Unable to reach BIS AI Backend at ${DIRECT_BACKEND_URL}. Please ensure your FastAPI server is running with 'python api_server.py'. (${directErr.message || 'Connection Refused'})`
      );
    }
  }
}

/**
 * Multimodal Chat API Call (Image / Document upload for compliance check)
 * POST /chat/multimodal
 * Form Data: session_id, message, file
 */
export async function sendMultimodalMessage(
  sessionId: string,
  message: string,
  file: File
): Promise<ChatNormalizedResponse> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('message', message || 'Analyze this attachment in accordance with Indian Standards (BIS).');
  formData.append('file', file);

  const primaryUrl = `${getApiBaseUrl()}/chat/multimodal`;
  const fallbackUrl = `${PROXY_BACKEND_URL}/chat/multimodal`;

  try {
    const response = await fetch(primaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorDetail = await response.text().catch(() => 'Upload error');
      throw new Error(`Server returned ${response.status}: ${errorDetail}`);
    }

    const data: RawBackendResponse = await response.json();
    return normalizeChatResponse(data);
  } catch (err: any) {
    // Attempt proxy fallback
    const fallbackResponse = await fetch(fallbackUrl, {
      method: 'POST',
      body: formData,
    });

    if (!fallbackResponse.ok) {
      throw new Error(`Multimodal upload failed: ${err.message}`);
    }

    const fallbackData: RawBackendResponse = await fallbackResponse.json();
    return normalizeChatResponse(fallbackData);
  }
}

/**
 * Check connectivity to FastAPI backend
 */
export async function checkBackendHealth(): Promise<{ online: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const res = await fetch(`${getApiBaseUrl()}/docs`, {
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors', // Opaque check succeeds if server is listening on port
    });
    const latency = Math.round(performance.now() - start);
    return { online: true, latencyMs: latency };
  } catch (e) {
    try {
      // Fallback check through Vite proxy
      await fetch(`${PROXY_BACKEND_URL}/docs`, { method: 'HEAD', cache: 'no-cache' });
      return { online: true, latencyMs: Math.round(performance.now() - start) };
    } catch {
      return { online: false, latencyMs: 0 };
    }
  }
}
