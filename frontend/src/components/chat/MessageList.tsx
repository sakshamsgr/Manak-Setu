import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from '../../types/chat';
import { MessageItem } from './MessageItem';
import { ShieldCheck, ChevronDown, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRetry?: () => void;
  onStartProductGuide?: (query: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onRetry,
  onStartProductGuide 
}) => {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const lastProcessedMessageId = useRef<string | null>(null);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // If the user manually scrolls up, turn off auto-scrolling
    setIsAutoScrolling(isNearBottom);
    setShowScrollBottom(!isNearBottom);
  };

  useEffect(() => {
    // Always scroll to bottom when loading starts (to show the spinner)
    if (isLoading) {
      scrollToBottom(true);
      return;
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];

      // ISSUE 1 FIX: If a NEW AI message arrives, scroll to its TOP and disable auto-scrolling
      if (lastMsg.role !== 'user' && lastMsg.id !== lastProcessedMessageId.current) {
        const msgElement = document.getElementById(`msg-${lastMsg.id}`);
        if (msgElement) {
          msgElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          lastProcessedMessageId.current = lastMsg.id;
          setIsAutoScrolling(false); // Let the user read from the top while it streams!
        }
      } 
      // If the user sends a new message, force scroll to bottom
      else if (lastMsg.role === 'user' && lastMsg.id !== lastProcessedMessageId.current) {
        scrollToBottom(true);
        lastProcessedMessageId.current = lastMsg.id;
        setIsAutoScrolling(true);
      }
      // If the AI message is just streaming/updating, only auto-scroll if the user is already at the bottom
      else if (isAutoScrolling) {
        scrollToBottom(false);
      }
    }
  }, [messages, isLoading, isAutoScrolling]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative"
    >
      <div className="w-full space-y-3">
        {messages.map((message) => (
          // Added an ID here so the scroll logic can target specific messages
          <div id={`msg-${message.id}`} key={message.id}>
            <MessageItem 
              message={message} 
              onRetry={onRetry} 
              onStartProductGuide={onStartProductGuide} 
            />
          </div>
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
                <span>{t('common.loading') || 'Searching BIS Standards Repository...'}</span>
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
          onClick={() => {
            scrollToBottom(true);
            setIsAutoScrolling(true);
          }}
          className="fixed bottom-24 right-6 sm:right-10 p-2.5 rounded-full bg-bis-800 hover:bg-bis-700 active:bg-bis-900 text-white shadow-lg border border-bis-700 transition-all animate-fade-in z-20"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};