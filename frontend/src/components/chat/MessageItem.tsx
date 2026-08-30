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
  AlertTriangle
} from 'lucide-react';
import { ChatMessage } from '../../types/chat';
import { SourcesList } from './CitationCard';

interface MessageItemProps {
  message: ChatMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const isUser = message.role === 'user';
  const isError = message.isError;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
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

    // Clean markdown before speaking
    const cleanText = message.content
      .replace(/[#*_`~\[\]]/g, '')
      .replace(/\(http[^)]+\)/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div
      className={`flex gap-3 sm:gap-4 py-3 sm:py-4 px-2 sm:px-4 animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar Icon */}
      <div className="shrink-0">
        {isUser ? (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        ) : (
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-bis-800 to-bis-950 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Role & Timestamp Header */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-600">
            {isUser ? 'You' : 'BIS AI Compliance Assistant'}
          </span>
          <span>•</span>
          <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          {message.attachmentName && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
              <FileText className="w-3 h-3" />
              {message.attachmentName}
            </span>
          )}
        </div>

        {/* Message Bubble */}
        <div
          className={`rounded-2xl p-4 sm:p-5 shadow-sm text-sm sm:text-[15px] leading-relaxed transition-all ${
            isUser
              ? 'bg-bis-800 text-white rounded-tr-none'
              : isError
              ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-none'
              : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-soft'
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap font-normal">{message.content}</div>
          ) : (
            <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-bis-900 prose-a:text-bis-600 prose-strong:text-slate-900 prose-code:text-bis-700 prose-code:bg-bis-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-table:border prose-table:border-slate-200 prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-200">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Render Sources & Citations Component directly beneath AI's response */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <SourcesList citations={message.citations} />
          )}
        </div>

        {/* Action Controls for Assistant Message */}
        {!isUser && !isError && (
          <div className="flex items-center gap-1.5 mt-1.5 px-1 text-slate-400">
            <button
              onClick={handleCopy}
              className="p-1 hover:text-slate-700 hover:bg-slate-200/60 rounded text-xs transition-colors flex items-center gap-1"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {'speechSynthesis' in window && (
              <button
                onClick={handleSpeak}
                className="p-1 hover:text-slate-700 hover:bg-slate-200/60 rounded text-xs transition-colors flex items-center gap-1"
                title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px]">{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>
            )}

            <div className="h-3 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className={`p-1 rounded text-xs transition-colors ${
                feedback === 'up' ? 'text-emerald-600 bg-emerald-50' : 'hover:text-slate-700 hover:bg-slate-200/60'
              }`}
              title="Helpful response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className={`p-1 rounded text-xs transition-colors ${
                feedback === 'down' ? 'text-rose-600 bg-rose-50' : 'hover:text-slate-700 hover:bg-slate-200/60'
              }`}
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
