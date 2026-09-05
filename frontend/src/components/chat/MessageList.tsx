import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from '../../types/chat';
import { MessageItem } from './MessageItem';
import { ShieldCheck, ChevronDown, Sparkles, BookOpen, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRetry?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onRetry }) => {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShowScrollBottom(!isNearBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative"
    >
      <div className="w-full space-y-3">
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            onRetry={onRetry} 
          />
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 py-4 px-2 sm:px-4 animate-fade-in">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-bis-800 to-bis-950 text-amber-400 border border-amber-400/30 flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-soft max-w-[80%] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-bis-800">
                <Loader2 className="w-4 h-4 animate-spin text-bis-600" />
                <span>{t('common.loading') || 'Searching BIS Standards Repository & Regulatory Guidelines...'}</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-2.5 bg-slate-100 rounded-full w-4/5 animate-pulse"></div>
                <div className="h-2.5 bg-slate-100 rounded-full w-full animate-pulse"></div>
                <div className="h-2.5 bg-slate-100 rounded-full w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="fixed bottom-24 right-6 sm:right-10 p-2.5 rounded-full bg-bis-800 hover:bg-bis-700 active:bg-bis-900 text-white shadow-lg border border-bis-700 transition-all animate-fade-in z-20"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
