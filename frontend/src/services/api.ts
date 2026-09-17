import { RawBackendResponse, ChatNormalizedResponse, Citation } from '../types/chat';

/**
 * Bureau of Indian Standards API Configuration
 * Defaults to direct FastAPI local backend URL http://127.0.0.1:8000
 * Falls back to /api or Vite proxy if direct cross-origin is restricted.
 */
// 1. Detect if running on your local computer
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 2. Localhost stays local. But on Vercel, we leave it EMPTY only if no environment variable is provided!
const DIRECT_BACKEND_URL = isLocal 
  ? 'http://localhost:8000' 
  : ''; 

const PROXY_BACKEND_URL = '/api';

/**
 * Determine best available API endpoint URL
 */
export function getApiBaseUrl(): string {
  // Check for BOTH variable names just in case!
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    // Ensure we don't accidentally return a URL with a trailing slash
    return (envUrl as string).replace(/\/$/, '');
  }
  return DIRECT_BACKEND_URL;
}

/**
 * Normalizes backend responses from either {reply, citations} or {response, citations}
 */

/**
 * Normalizes backend responses from either {reply, citations} or {response, citations}
 */
export function normalizeChatResponse(data: RawBackendResponse): ChatNormalizedResponse {
  const replyText = data.reply || data.response || 'No response text received from standard RAG engine.';
  
  const rawCitations = Array.isArray(data.citations) ? data.citations : [];
  const normalizedCitations: Citation[] = rawCitations.map((item) => {
    const document = item.document || item.document_title || item.title || item.standard_id || 'Indian Standard (BIS)';
    const title = item.title || item.document_title || document;
    const page = item.page ?? item.page_number ?? 1;
    const text = item.text || item.content || '';
    const url = item.url || item.source_url || item.pdf_url || '';
    const distance = item.distance;
    return {
      document,
      title,
      document_title: title,
      page,
      page_number: page,
      text,
      url,
      source_url: url,
      pdf_url: item.pdf_url,
      source: item.source,
      distance,
      standard_id: item.standard_id || document,
    };
  });

  return {
    reply: replyText,
    citations: normalizedCitations,
    filename: data.filename,
  };
}

/**
 * Global 10-Second API Timeout specification (Plan Section 8)
 */
export const API_TIMEOUT_MS = 15000;

export class ApiTimeoutError extends Error {
  isTimeout: boolean;
  constructor(message = 'AI response is taking longer than expected. Please try again.') {
    super(message);
    this.name = 'ApiTimeoutError';
    this.isTimeout = true;
  }
}

/**
 * Sanitizes backend error responses to extract clean user-friendly messages
 * without exposing raw JSON, internal database traces, or system paths.
 */
export async function safeExtractErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const text = await response.text();
    if (!text) return defaultMessage;
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.detail === 'string' && parsed.detail.trim()) {
        return parsed.detail.trim();
      }
      if (parsed && typeof parsed.error === 'string' && parsed.error.trim()) {
        return parsed.error.trim();
      }
      if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
        return parsed.message.trim();
      }
    } catch {
      if (!text.includes('<!DOCTYPE') && !text.includes('<html') && text.length < 200) {
        return text.trim();
      }
    }
  } catch {
    // Ignore extraction error
  }
  return defaultMessage;
}

/**
 * Fetch wrapper that strictly enforces a timeout (defaults to 10 seconds).
 * Links caller's AbortSignal so either cancellation or timeout safely terminates the request.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const timeoutController = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    timeoutController.abort();
  }, timeoutMs);

  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timer);
      throw new DOMException('Aborted', 'AbortError');
    }
    options.signal.addEventListener('abort', () => {
      clearTimeout(timer);
      timeoutController.abort();
    });
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: timeoutController.signal,
    });
    return response;
  } catch (error: any) {
    if (timedOut || error.name === 'TimeoutError' || (error.name === 'AbortError' && timedOut)) {
      throw new ApiTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Core Chat API Call
 * POST /chat
 * Body: { "session_id": string, "message": string, "language": string, "context": object }
 */
export async function sendChatMessage(
  sessionId: string, 
  message: string,
  language: string = 'en',
  context?: Record<string, any>,
  signal?: AbortSignal
): Promise<ChatNormalizedResponse> {
  const payload = {
    session_id: sessionId,
    message: message.trim(),
    language: language || 'en',
    context: context || undefined,
  };

  const primaryUrl = `${getApiBaseUrl()}/chat`;
  const fallbackUrl = `${PROXY_BACKEND_URL}/chat`;

  try {
    const response = await fetchWithTimeout(primaryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorDetail = await safeExtractErrorMessage(response, 'Compliance service temporarily unavailable.');
      throw new Error(errorDetail);
    }

    const data: RawBackendResponse = await response.json();
    return normalizeChatResponse(data);
  } catch (directErr: any) {
    if (directErr.name === 'AbortError' || directErr.name === 'ApiTimeoutError' || directErr.isTimeout || directErr instanceof ApiTimeoutError) {
      throw directErr;
    }
    console.warn(`[BIS API Client] Direct call to ${primaryUrl} failed. Trying proxy fallback...`, directErr);

    try {
      const fallbackResponse = await fetchWithTimeout(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!fallbackResponse.ok) {
        const errorDetail = await safeExtractErrorMessage(fallbackResponse, 'Compliance service temporarily unavailable.');
        throw new Error(errorDetail);
      }

      const fallbackData: RawBackendResponse = await fallbackResponse.json();
      return normalizeChatResponse(fallbackData);
    } catch (fallbackErr: any) {
      if (fallbackErr.name === 'AbortError' || fallbackErr.name === 'ApiTimeoutError' || fallbackErr.isTimeout || fallbackErr instanceof ApiTimeoutError) {
        throw fallbackErr;
      }
      console.error('[BIS API Client] Both direct and proxy endpoints failed:', fallbackErr);
      throw new Error('Unable to connect to the BIS Compliance Service. Please check your network connection and try again.');
    }
  }
}

/**
 * Multimodal Chat API Call (Image / Document upload for compliance check)
 * POST /chat/multimodal
 * Form Data: session_id, message, file, language
 */
export async function sendMultimodalMessage(
  sessionId: string,
  message: string,
  file: File,
  language: string = 'en',
  signal?: AbortSignal
): Promise<ChatNormalizedResponse> {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('message', message || 'Analyze this attachment in accordance with Indian Standards (BIS).');
  formData.append('file', file);
  formData.append('language', language || 'en');

  const primaryUrl = `${getApiBaseUrl()}/chat/multimodal`;
  const fallbackUrl = `${PROXY_BACKEND_URL}/chat/multimodal`;

  try {
    const response = await fetchWithTimeout(primaryUrl, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!response.ok) {
      const errorDetail = await safeExtractErrorMessage(response, 'Multimodal compliance service temporarily unavailable.');
      throw new Error(errorDetail);
    }

    const data: RawBackendResponse = await response.json();
    return normalizeChatResponse(data);
  } catch (err: any) {
    if (err.name === 'AbortError' || err.name === 'ApiTimeoutError' || err.isTimeout || err instanceof ApiTimeoutError) throw err;
    const fallbackResponse = await fetchWithTimeout(fallbackUrl, {
      method: 'POST',
      body: formData,
      signal,
    });

    if (!fallbackResponse.ok) {
      const errorDetail = await safeExtractErrorMessage(fallbackResponse, 'Multimodal upload failed.');
      throw new Error(errorDetail);
    }

    const fallbackData: RawBackendResponse = await fallbackResponse.json();
    return normalizeChatResponse(fallbackData);
  }
}

/**
 * Structured Product Guide Resolver: Resolves Stage 1, 2, 3 data from Supabase
 * POST /api/product-guide/resolve
 */
export async function resolveProductGuide(params: {
  query: string;
  productName?: string;
  industryCategory?: string;
  enterpriseScale?: string;
  isForeign?: boolean;
  language?: string;
  signal?: AbortSignal;
}): Promise<any> {
  const payload = {
    query: params.query,
    product_name: params.productName,
    industry_category: params.industryCategory,
    enterprise_scale: params.enterpriseScale || 'micro',
    is_foreign: params.isForeign || false,
    language: params.language || 'en',
  };

  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/product-guide/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: params.signal,
  });

  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Product resolution service temporarily unavailable.');
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Get Testing and Laboratories for a Standard
 * GET /api/standards/{standard_id}/testing-and-labs
 */
export async function getTestingAndLabs(standardId: string, signal?: AbortSignal): Promise<any> {
  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/standards/${encodeURIComponent(standardId)}/testing-and-labs`, {
    signal,
  });
  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Testing & laboratories query failed.');
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Get Application Documents for a Standard
 * GET /api/standards/{standard_id}/documents
 */
export async function getStandardDocuments(standardId: string, signal?: AbortSignal): Promise<any> {
  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/standards/${encodeURIComponent(standardId)}/documents`, {
    signal,
  });
  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Standard documents query failed.');
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Get Certification Process Milestones for a Standard
 * GET /api/standards/{standard_id}/process
 */
export async function getStandardProcess(standardId: string, signal?: AbortSignal): Promise<any> {
  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/standards/${encodeURIComponent(standardId)}/process`, {
    signal,
  });
  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Process milestones query failed.');
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Get Available Standards Options for Selection / Dropdown
 * GET /api/standards/options
 */
export async function getStandardsOptions(signal?: AbortSignal): Promise<{ options: Array<{ id: string; code: string; title: string }> }> {
  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/standards/options`, { signal });
  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Standards options query failed.');
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Database-Driven Fee Calculator
 * POST /api/estimator/calculate
 */
export async function calculateFeeEstimate(params: {
  standardId?: string;
  scheme?: string;
  industryScale?: string;
  isForeign?: boolean;
  numVarieties?: number;
  inspectionDays?: number;
  signal?: AbortSignal;
}): Promise<any> {
  const payload = {
    standard_id: params.standardId || '',
    scheme: params.scheme || 'Scheme-I',
    industry_scale: params.industryScale || 'micro',
    is_foreign: params.isForeign || false,
    num_varieties: params.numVarieties || 1,
    inspection_days: params.inspectionDays || 2,
  };

  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/estimator/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: params.signal,
  });

  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Fee estimate calculation failed.');
    throw new Error(msg);
  }
  return res.json();
}

export interface ConsumerVerificationResult {
  query_type: 'cml' | 'huid' | 'standard';
  input: string;
  normalized_code?: string;
  valid_format?: boolean;
  title: string;
  description: string;
  mandatory_marks?: Array<{ mark: string; desc: string }>;
  verification_steps?: string[];
  official_url: string;
  found?: boolean;
  verified?: boolean;
  error?: boolean;
  prototype_label?: string;
  huid?: string;
  article_material?: string;
  purity?: string;
  jeweller_registration_number?: string;
  jeweller_name?: string;
  ahc_centre_name?: string;
  ahc_recognition_number?: string;
  ahc_address?: string;
  is_mandatory?: boolean;
  qco?: {
    qco_name: string;
    notification_number: string;
    effective_date: string;
  } | null;
}

/**
 * Consumer Verification API: Verify CM/L number, Gold HUID, or Indian Standard
 * GET /api/consumer/verify
 */
export async function verifyConsumerMark(params: {
  queryType: 'cml' | 'huid' | 'standard';
  code: string;
  language?: string;
  signal?: AbortSignal;
}): Promise<ConsumerVerificationResult> {
  const url = `${getApiBaseUrl()}/api/consumer/verify?query_type=${encodeURIComponent(params.queryType)}&code=${encodeURIComponent(params.code)}&language=${encodeURIComponent(params.language || 'en')}`;
  const res = await fetchWithTimeout(url, { signal: params.signal });
  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'Mark verification service temporarily unavailable.');
    throw new Error(msg);
  }
  return res.json();
}

export interface DocumentScanResult {
  document_id: string;
  filename: string;
  filesize: number;
  status: 'Verified' | 'Discrepancy' | 'Failed' | 'Verification Pending' | 'Uploaded';
  confidence_score?: number;
  summary: string;
  checklist_matches?: string[];
  discrepancies?: string[];
  statutory_disclaimer: string;
}

/**
 * Statutory Document Compliance AI Pre-Scan
 * POST /api/documents/scan
 */
export async function scanDocumentCompliance(params: {
  file: File;
  documentId: string;
  documentTitle: string;
  standardId?: string;
  sessionId?: string;
  language?: string;
  signal?: AbortSignal;
}): Promise<DocumentScanResult> {
  const formData = new FormData();
  formData.append('file', params.file);
  formData.append('document_id', params.documentId);
  formData.append('document_title', params.documentTitle);
  if (params.standardId) formData.append('standard_id', params.standardId);
  if (params.sessionId) formData.append('session_id', params.sessionId);
  if (params.language) formData.append('language', params.language);

  const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/documents/scan`, {
    method: 'POST',
    body: formData,
    signal: params.signal,
  });

  if (!res.ok) {
    const errorDetail = await safeExtractErrorMessage(res, 'Document compliance pre-scan failed.');
    throw new Error(errorDetail);
  }
  return res.json();
}

/**
 * Chat History API: Load Persisted Messages
 * GET /api/chat/history
 */
export async function getChatHistory(sessionId?: string, signal?: AbortSignal): Promise<{ user_id: string; history: any[] }> {
  const url = sessionId ? `${getApiBaseUrl()}/api/chat/history?session_id=${encodeURIComponent(sessionId)}` : `${getApiBaseUrl()}/api/chat/history`;
  const res = await fetchWithTimeout(url, { credentials: 'include', signal });
  if (!res.ok) {
    return { user_id: sessionId || 'anonymous', history: [] };
  }
  return res.json();
}

/**
 * Chat History API: Clear Persisted Messages
 * POST /api/chat/history/clear
 */
export async function clearChatHistory(sessionId?: string): Promise<void> {
  const url = sessionId ? `${getApiBaseUrl()}/api/chat/history/clear?session_id=${encodeURIComponent(sessionId)}` : `${getApiBaseUrl()}/api/chat/history/clear`;
  await fetchWithTimeout(url, { method: 'POST', credentials: 'include' });
}

/**
 * Check connectivity to FastAPI backend
 */
export async function checkBackendHealth(): Promise<{ online: boolean; latencyMs: number }> {
  const start = performance.now();
  try {
    const res = await fetchWithTimeout(`${getApiBaseUrl()}/api/status`, {
      method: 'GET',
      cache: 'no-cache',
    }, 3000);
    const latency = Math.round(performance.now() - start);
    return { online: res.ok, latencyMs: latency };
  } catch (e) {
    try {
      const res2 = await fetchWithTimeout(`${getApiBaseUrl()}/`, { method: 'GET', cache: 'no-cache' }, 3000);
      return { online: res2.ok, latencyMs: Math.round(performance.now() - start) };
    } catch {
      return { online: false, latencyMs: 0 };
    }
  }
}

/**
 * User Saved Product Guide Models & APIs (Issue 4 & 5)
 */
export interface SavedProductGuideItem {
  id: string;
  product_name: string;
  standard_code?: string;
  active_step: number;
  query?: string;
  product_profile: any;
  guide_data: any;
  updated_at: string;
}

export async function saveUserProductGuide(data: {
  product_name: string;
  standard_code?: string;
  active_step?: number;
  query?: string;
  product_profile?: any;
  guide_data?: any;
}): Promise<{ success: boolean; id?: string; message?: string }> {
  const res = await fetch(`${getApiBaseUrl()}/api/user/saved-guides`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to save guide' }));
    throw new Error(err.detail || 'Failed to save product guide');
  }
  return res.json();
}

export async function getUserSavedGuides(): Promise<SavedProductGuideItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/user/saved-guides`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.saved_guides || [];
  } catch {
    return [];
  }
}

export async function deleteUserSavedGuide(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/user/saved-guides/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Nearest Laboratories Recommendation API (Issue 6 & 7)
 */
export interface RecommendedLab {
  id: number;
  lab_name: string;
  osl_code?: string;
  address: string;
  city: string;
  state: string;
  status: string;
  source_url?: string;
  testing_charge?: number;
  testing_scopes?: {
    testing_charge?: number;
    currency?: string;
    grade_type_size?: string;
    remarks?: string;
  }[];
  currency: string;
  remarks?: string;
  proximity_tier: string;
  tier_score: number;
}

export async function getRecommendedLaboratories(params: {
  location?: string;
  standard_id?: string;
  lat?: number;
  lng?: number;
  signal?: AbortSignal;
}): Promise<{
  query_location: string;
  detected_city?: string;
  detected_state?: string;
  total_laboratories: number;
  laboratories: RecommendedLab[];
}> {
  const queryParams = new URLSearchParams();
  if (params.location) queryParams.append('location', params.location);
  if (params.standard_id) queryParams.append('standard_id', params.standard_id);
  if (params.lat !== undefined) queryParams.append('lat', params.lat.toString());
  if (params.lng !== undefined) queryParams.append('lng', params.lng.toString());

  const url = `${getApiBaseUrl()}/api/labs/recommend?${queryParams.toString()}`;
  const res = await fetchWithTimeout(url, { signal: params.signal }, 6000);
  if (!res.ok) {
    throw new Error('Failed to retrieve laboratory recommendations');
  }
  return res.json();
}

export interface HallmarkingCentre {
  id: string;
  name: string;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  address?: string | null;
  status?: string | null;
  recognized_for?: string | null;
  telephone?: string | null;
  email?: string | null;
  gold_hallmarking?: boolean;
  silver_hallmarking?: boolean;
}

export async function getHallmarkingCentres(params: {
  state?: string;
  metal?: 'gold' | 'silver';
  operativeOnly?: boolean;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<{
  states: string[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  centres: HallmarkingCentre[];
}> {
  const queryParams = new URLSearchParams();
  if (params.state) queryParams.append('state', params.state);
  if (params.metal) queryParams.append('metal', params.metal);
  queryParams.append('operative_only', String(params.operativeOnly !== false));
  if (params.page) queryParams.append('page', String(params.page));
  if (params.limit) queryParams.append('limit', String(params.limit));

  const url = `${getApiBaseUrl()}/api/hallmarking-centres?${queryParams.toString()}`;
  const res = await fetchWithTimeout(url, { signal: params.signal }, 15000);
  if (!res.ok) {
    throw new Error('Failed to load BIS Assaying & Hallmarking centres.');
  }
  return res.json();
}

/**
 * Chat History Language Translation API (Phase 8)
 * Translates an array of text snippets to the target language, preserving IS numbers and citations.
 */
export async function translateChatMessages(params: {
  texts: string[];
  target_language: string;
  source_language?: string;
  signal?: AbortSignal;
}): Promise<string[]> {
  if (!params.texts || params.texts.length === 0) return [];
  const url = `${getApiBaseUrl()}/api/chat/translate`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: params.texts,
        target_language: params.target_language,
        source_language: params.source_language || 'auto',
      }),
      signal: params.signal,
    },
    10000
  );
  if (!res.ok) {
    throw new Error('Failed to translate chat messages');
  }
  const data = await res.json();
  return data.translations || [];
}

/**
 * Real BIS Notification Item from Supabase / bis_notifications table
 */
export interface BisNotificationItem {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  previous_value?: any;
  new_value?: any;
  created_at: string;
  dedupe_key?: string;
}

export interface BisNotificationsResponse {
  success: boolean;
  total: number;
  notifications: BisNotificationItem[];
}

/**
 * Fetch real BIS regulatory notifications
 * GET /api/notifications
 */
export async function getBisNotifications(
  params?: { limit?: number; notification_type?: string },
  signal?: AbortSignal
): Promise<BisNotificationsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', String(params.limit));
  if (params?.notification_type) queryParams.set('notification_type', params.notification_type);

  const url = `${getApiBaseUrl()}/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const res = await fetchWithTimeout(url, { signal }, 8000);
  if (!res.ok) {
    const msg = await safeExtractErrorMessage(res, 'BIS regulatory updates are temporarily unavailable.');
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Trigger backend regulatory scan sync
 * POST /api/notifications/sync
 */
export async function syncBisNotifications(signal?: AbortSignal): Promise<{ success: boolean; result?: any; message?: string }> {
  const url = `${getApiBaseUrl()}/api/notifications/sync`;
  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
    },
    25000
  );
  if (!res.ok) {
    throw new Error('Failed to synchronize with BIS regulatory monitor');
  }
  return res.json();
}

