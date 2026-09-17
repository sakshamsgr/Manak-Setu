import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  FileText,
  User,
  ShieldCheck,
  RotateCcw,
  Languages,
  ArrowRight,
  PackageSearch,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ChatMessage } from '../../types/chat';
import { SourcesList } from './CitationCard';

interface MessageItemProps {
  message: ChatMessage;
  onRetry?: () => void;
  onStartProductGuide?: (query: string) => void; 
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onRetry, onStartProductGuide }) => {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.isError;

  const hasTranslation = Boolean(
    message.translations &&
    message.translations[language] &&
    message.translations[language].trim() !== message.content.trim()
  );

  const displayContent = (!showOriginal && hasTranslation)
    ? message.translations![language]
    : message.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = displayContent.replace(/[#*_`~\[\]]/g, '').replace(/\(http[^)]+\)/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // =========================================================================
  // ROBUST PRODUCT EXTRACTION WITH STRICT BLACKLIST FILTER
  // =========================================================================
  let suggestedProduct = "";
  
  if (!isUser && !isError) {
    // 1. Try to extract from Citations
    if (message.citations && message.citations.length > 0) {
      const citation = message.citations.find(c => c.title && !c.title.toLowerCase().includes("guidance") && !c.title.toLowerCase().includes("transition"));
      
      if (citation) {
        const rawTitle = citation.title || citation.document_title || "";
        if (rawTitle.includes("—")) {
          suggestedProduct = rawTitle.split("—")[1].replace(/\(.*?\)/g, '').trim();
        } else if (rawTitle.includes("-")) {
          const parts = rawTitle.split("-");
          suggestedProduct = parts[parts.length - 1].replace(/\(.*?\)/g, '').trim();
        } else {
          suggestedProduct = rawTitle.replace(/\(.*?\)/g, '').trim();
        }
        
        if (suggestedProduct.match(/^IS\s*\d+/i)) {
          suggestedProduct = ""; 
        }
      }
    }

    // 2. Fallback: Scan text for bolded product subjects
    if (!suggestedProduct) {
      const boldMatch = displayContent.match(/\*\*([A-Z][a-zA-Z\s]+)\*\*/);
      if (boldMatch && boldMatch[1].length > 3 && boldMatch[1].length < 35) {
        suggestedProduct = boldMatch[1].trim();
      }
    }

    // 3. Ultimate Fallback: Scan text for standard IS codes (e.g. IS 302-2-3)
    if (!suggestedProduct) {
      const isCodeMatch = displayContent.match(/\b(IS\s*\d+(?:\s*:\s*\d+)?)\b/i);
      if (isCodeMatch) {
        suggestedProduct = isCodeMatch[1].trim();
      }
    }
  }

  // Strict blacklist to completely block generic terms, legal frameworks, and greetings from showing the CTA
  const blacklistedTerms = [
    'bureau of indian standards', 'bis act', 'quality control order', 'qco',
    'isi mark', 'compulsory registration scheme', 'crs', 'fmcs', 'hallmarking',
    'huid', 'nabl', 'welcome', 'manak setu', 'standards', 'compliance'
  ];

  const isBlacklisted = blacklistedTerms.some(term => suggestedProduct.toLowerCase().includes(term));

  // Only show button if we have a valid product name/code and it is NOT blacklisted
  const showProductGuideCTA = Boolean(
    onStartProductGuide && 
    suggestedProduct && 
    !isBlacklisted &&
    suggestedProduct.length >= 3 && 
    suggestedProduct.length < 50
  );

  return (
    <div className={`flex gap-2 sm:gap-3 py-1.5 px-1 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className="shrink-0 mt-1">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shadow-sm border border-slate-200">
            <User className="w-4 h-4" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bis-800 to-bis-950 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className={`flex flex-col max-w-[90%] sm:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400 flex-wrap">
          <span className="font-semibold text-slate-600">{isUser ? 'You' : 'Manak Setu AI'}</span>
          <span>•</span>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {hasTranslation && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-800 border border-amber-200/80 px-1.5 py-0.2 rounded font-medium">
              <Languages className="w-2.5 h-2.5 text-amber-600" />
              {showOriginal ? (t('assistant.original') || 'Original') : (language === 'hi' ? 'हिन्दी' : language === 'bn' ? 'বাংলা' : 'English')}
            </span>
          )}
        </div>

        <div
          className={`rounded-2xl p-4 sm:p-5 shadow-sm text-sm sm:text-base leading-relaxed transition-all ${
            isUser
              ? 'bg-slate-100 text-slate-800 rounded-tr-none'
              : isError
              ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none'
              : 'bg-white border border-slate-200/60 text-slate-800 rounded-tl-none'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap font-medium">{displayContent}</div>
          ) : (
            <div className="prose prose-slate max-w-none 
              prose-p:leading-relaxed prose-p:mb-4 
              prose-headings:text-bis-900 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
              prose-h3:text-lg prose-h4:text-base
              prose-a:text-bis-600 
              prose-strong:text-slate-900 prose-strong:font-extrabold
              prose-ul:my-4 prose-ul:space-y-2 prose-li:marker:text-amber-500
              prose-code:text-bis-700 prose-code:bg-bis-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayContent}
              </ReactMarkdown>
            </div>
          )}

          {/* ATTRACTIVE DYNAMIC PRODUCT GUIDE CTA */}
          {showProductGuideCTA && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">Want to know more about this?</p>
                  <p className="text-xs font-bold text-slate-700">Open full compliance guide for <span className="text-bis-700">"{suggestedProduct}"</span></p>
                </div>
              </div>
              <button
                onClick={() => onStartProductGuide!(suggestedProduct)}
                className="group relative flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl text-sm font-extrabold transition-all shadow-[0_4px_14px_0_rgba(245,158,11,0.39)] hover:shadow-[0_6px_20px_rgba(245,158,11,0.23)] hover:-translate-y-0.5 active:translate-y-0 overflow-hidden shrink-0 cursor-pointer"
              >
                {/* Shine animation effect overlay */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out"></div>
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Start Product Guide</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          )}

          {isError && (onRetry || message.canRetry) && (
            <div className="mt-3 pt-2.5 border-t border-rose-200/80 flex items-center justify-between">
              <span className="text-xs text-rose-700">
                {message.isTimeout ? t('common.aiTimeout') : t('common.apiUnavailable')}
              </span>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer transform active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('common.retry') || 'Retry'}</span>
                </button>
              )}
            </div>
          )}

          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-4">
              <SourcesList citations={message.citations} />
            </div>
          )}
        </div>

        {isUser && hasTranslation && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="inline-flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <Languages className="w-3 h-3" />
            <span>{showOriginal ? (t('assistant.viewTranslation') || 'View Translation') : (t('assistant.viewOriginal') || 'View Original')}</span>
          </button>
        )}

        {!isUser && !isError && (
          <div className="flex items-center gap-1.5 mt-2 px-2 text-slate-400">
            <button onClick={handleCopy} className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors flex items-center gap-1.5" title="Copy answer">
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            {'speechSynthesis' in window && (
              <button onClick={handleSpeak} className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors flex items-center gap-1.5" title={isSpeaking ? 'Stop reading' : 'Read aloud'}>
                {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            {hasTranslation && (
              <>
                <div className="h-4 w-px bg-slate-200 mx-1" />
                <button onClick={() => setShowOriginal(!showOriginal)} className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg text-xs transition-colors flex items-center gap-1.5 text-bis-700 font-medium cursor-pointer">
                  <Languages className="w-4 h-4 text-bis-600" />
                  <span className="text-[11px]">{showOriginal ? 'Show Translation' : 'View Original'}</span>
                </button>
              </>
            )}
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <button onClick={() => setFeedback(feedback === 'up' ? null : 'up')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'hover:text-slate-700 hover:bg-slate-100'}`}>
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button onClick={() => setFeedback(feedback === 'down' ? null : 'down')} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-700 hover:bg-slate-100'}`}>
              <ThumbsDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};