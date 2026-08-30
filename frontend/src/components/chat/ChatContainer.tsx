import React from 'react';
import { MessageList } from './MessageList';
import { QuickPrompts } from './QuickPrompts';
import { ChatInput } from './ChatInput';
import { ChatMessage, ChatSession } from '../../types/chat';
import { RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

interface ChatContainerProps {
  activeSession: ChatSession;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onSendAttachment: (message: string, file: File) => void;
  onClearChat: () => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
  activeSession,
  messages,
  isLoading,
  onSendMessage,
  onSendAttachment,
  onClearChat,
}) => {
  const showQuickPrompts = messages.length <= 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Session Title Header Bar */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[200px] sm:max-w-md">
            {activeSession?.title || 'BIS AI Consultation'}
          </h2>
          <span className="hidden sm:inline-block text-[11px] text-slate-400">
            ({messages.length} {messages.length === 1 ? 'message' : 'messages'})
          </span>
        </div>

        <button
          onClick={onClearChat}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Suggested Questions banner on new consultation */}
      {showQuickPrompts && (
        <QuickPrompts onSelectPrompt={onSendMessage} />
      )}

      {/* Message List */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input Box */}
      <ChatInput
        onSendMessage={onSendMessage}
        onSendAttachment={onSendAttachment}
        isLoading={isLoading}
      />
    </div>
  );
};
