import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  MessageSquare, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Sparkles, 
  Loader2, 
  ShieldCheck, 
  User, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw 
} from 'lucide-react';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { useLanguage } from '../../context/LanguageContext';
import { ApiTimeoutError } from '../../services/api';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  citations?: Citation[];
  filename?: string;
  isError?: boolean;
  isTimeout?: boolean;
  canRetry?: boolean;
}

interface RightSideAssistantProps {
  productName: string;
  activeStepName: string;
  onAskQuestion: (question: string, file?: File, signal?: AbortSignal) => Promise<{ reply: string; citations: Citation[] }>;
}

export const RightSideAssistant: React.FC<RightSideAssistantProps> = ({
  productName,
  activeStepName,
  onAskQuestion,
}) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your **BIS Compliance Assistant**. I am actively tracking your product **${productName || 'Product'}** on **${activeStepName}**.\n\nYou can ask specific clause questions, fee queries, or upload product spec PDFs & photos for verification.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
        activeAbortControllerRef.current = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && !selectedFile) || isLoading) return;

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    const fileToUpload = selectedFile || undefined;
    const userMessageText = query || (fileToUpload ? `Uploaded ${fileToUpload.name} for compliance analysis` : '');
    
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: userMessageText,
        filename: fileToUpload?.name,
      },
    ]);

    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      const res = await onAskQuestion(query, fileToUpload, controller.signal);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          citations: res.citations,
        },
      ]);
      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      if (err.name === 'AbortError' && !err.isTimeout) {
        return;
      }
      const isTimeout = err instanceof ApiTimeoutError || err.name === 'ApiTimeoutError' || err.isTimeout;
      const errorNotice = isTimeout ? t('common.aiTimeout') : t('common.apiUnavailable');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **${errorNotice}**`,
          isError: true,
          isTimeout: Boolean(isTimeout),
          canRetry: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      activeAbortControllerRef.current = null;
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.isError) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      handleSend(lastUserMsg.text);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const sampleQuickQuestions = [
    `What tests are mandatory for ${productName || 'this product'}?`,
    'Is in-house testing laboratory equipment compulsory?',
    'What is the fee concession for micro MSME units?',
    'Where is the nearest BIS recognized test laboratory?',
  ];

  return (
    <>
      {/* Mobile Floating Toggle Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-3.5 bg-bis-900 text-white rounded-full shadow-xl flex items-center gap-2 font-bold text-xs border-2 border-amber-400 active:scale-95 transition-all"
        >
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <span>{t('assistant.title') || 'Manak Setu AI'}</span>
          {isMobileOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Assistant Panel Container */}
      <aside
        className={`bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${
          isMobileOpen
            ? 'fixed inset-x-2 bottom-16 top-20 z-40 lg:relative lg:inset-auto lg:top-0 lg:z-auto'
            : 'hidden lg:flex lg:sticky lg:top-24 h-[calc(100vh-7.5rem)]'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-bis-800 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <span>{t('assistant.title')}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <p className="text-[10px] text-slate-300 truncate max-w-[200px]">
                {productName || 'Product'} • {activeStepName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-600 text-white rounded">
              {t('common.online') || 'Online'}
            </span>
            {isMobileOpen && (
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Question Pills */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto custom-scrollbar flex gap-1.5 shrink-0">
          {sampleQuickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-bis-300 text-slate-700 hover:text-bis-900 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Messages Stream */}
        <div className="flex-1 p-3.5 space-y-3.5 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 text-xs leading-relaxed ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div className="shrink-0">
                {msg.role === 'user' ? (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">
                    <User className="w-3 h-3" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bis-900 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-bis-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 shadow-2xs space-y-2'
                }`}
              >
                {msg.filename && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-black/20 px-2 py-0.5 rounded w-fit mb-1">
                    <Paperclip className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{msg.filename}</span>
                  </div>
                )}

                <div className="prose prose-slate max-w-none text-xs prose-p:leading-relaxed prose-headings:text-bis-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-1">
                    <CitationsEvidenceGrid citations={msg.citations} />
                  </div>
                )}

                {msg.role === 'assistant' && msg.isError && (
                  <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                    <span className="text-[11px] text-rose-700 font-medium">
                      {msg.isTimeout ? t('common.aiTimeout') : t('common.apiUnavailable')}
                    </span>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer"
                      title={t('common.retry') || 'Retry'}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('common.retry') || 'Retry'}</span>
                    </button>
                  </div>
                )}

                {msg.role === 'assistant' && !msg.isError && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                    >
                      {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-bis-800 p-2 font-medium bg-white rounded-xl border border-slate-200 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-bis-700" />
              <span>{t('common.loading') || 'Loading details...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Attachment Pill */}
        {selectedFile && (
          <div className="p-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-1.5 truncate">
              <Paperclip className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-semibold truncate max-w-[180px]">{selectedFile.name}</span>
              <span className="text-[10px] text-amber-600">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-amber-200 rounded text-amber-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2"
        >
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 focus-within:border-bis-600 focus-within:ring-2 focus-within:ring-bis-100 rounded-2xl p-1.5 transition-all">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-bis-900 transition-colors"
              title={t('assistant.upload')}
            >
              <Paperclip className="w-4 h-4 text-bis-700" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('assistant.inputPlaceholder')}
              disabled={isLoading}
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs text-slate-900 placeholder:text-slate-400 py-1"
            />

            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className={`p-2 rounded-xl text-white font-bold transition-all ${
                (input.trim() || selectedFile) && !isLoading
                  ? 'bg-bis-900 hover:bg-bis-800 shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
};
