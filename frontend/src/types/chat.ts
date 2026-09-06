export interface Citation {
  document: string;
  page: number;
  text?: string;
  distance?: number;
  // Backend alternate field aliases for seamless compatibility
  standard_id?: string;
  page_number?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  timestamp: number;
  attachmentName?: string;
  isError?: boolean;
  isTimeout?: boolean;
  canRetry?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatRequestPayload {
  session_id: string;
  message: string;
}

export interface RawBackendResponse {
  reply?: string;
  response?: string;
  citations?: Array<{
    document?: string;
    standard_id?: string;
    page?: number;
    page_number?: number;
    text?: string;
    distance?: number;
    [key: string]: any;
  }>;
  filename?: string;
}

export interface ChatNormalizedResponse {
  reply: string;
  citations: Citation[];
  filename?: string;
}
