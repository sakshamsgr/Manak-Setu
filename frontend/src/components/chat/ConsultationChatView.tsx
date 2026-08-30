import React from 'react';
import { MessageList } from './MessageList';
import { QuickPrompts } from './QuickPrompts';
import { ChatInput } from './ChatInput';
import { ChatMessage, ChatSession } from '../../types/chat';
import { RotateCcw, ShieldCheck, Sparkles, MessageSquare, Trash2, Plus } from 'lucide-react';

interface ConsultationChatViewProps {
  sessions: ChatSession[];
  activeSession: ChatSession;
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onSendAttachment: (message: string, file: File) => void;
  onClearChat: () => void;
}

export const ConsultationChatView: React.FC<ConsultationChatViewProps> = ({
  sessions,
  activeSession,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  messages,
  isLoading,
  onSendMessage,
  onSendAttachment,
  onClearChat,
}) => {
  const showQuickPrompts = messages.length <= 1;

  return (
    <div className="flex-1 flex h-[calc(100vh-140px)] bg-slate-50 overflow-hidden">
      {/* Session Sidebar for Chat View */}
      <div className="hidden md:flex w-64 bg-slate-900 text-slate-200 flex-col border-r border-slate-800">
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-bis-700 hover:bg-bis-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          <div className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
            Consultation History
          </div>
          {sessions.map((s) => {
            const isSelected = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-bis-800 text-amber-300 font-bold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{s.title}</span>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
        {/* Title Bar */}
        <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
              {activeSession?.title || 'BIS AI Consultation'}
            </h2>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              ({messages.length} messages)
            </span>
          </div>

          <button
            onClick={onClearChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {showQuickPrompts && <QuickPrompts onSelectPrompt={onSendMessage} />}

        <MessageList messages={messages} isLoading={isLoading} />

        <ChatInput
          onSendMessage={onSendMessage}
          onSendAttachment={onSendAttachment}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
