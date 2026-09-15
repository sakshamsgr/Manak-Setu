import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Menu, 
  X, 
  Sparkles, 
  Tag, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  Trash2
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../../types/chat';
import { PersistentAssistantContext } from './PersistentAiAssistant';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

interface AskManakSetuViewProps {
  messages: ChatMessage[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  createNewSession: () => void;
  deleteSession: (id: string) => void;
  isLoading: boolean;
  onSendMessage: (msg: string, context?: Record<string, any>) => void;
  onSendAttachment: (msg: string, file: File) => void;
  onClearChat: () => void;
  onRetry?: () => void;
  contextData?: PersistentAssistantContext;
  onStartProductGuide: (query: string) => void;
}

export const AskManakSetuView: React.FC<AskManakSetuViewProps> = ({
  messages,
  sessions,
  activeSessionId,
  setActiveSessionId,
  createNewSession,
  deleteSession,
  isLoading,
  onSendMessage,
  onSendAttachment,
  onClearChat,
  onRetry,
  contextData,
  onStartProductGuide,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [activeCtx, setActiveCtx] = useState<PersistentAssistantContext | null>(
    (contextData?.productName || contextData?.standardId) ? contextData : null
  );

  useEffect(() => {
    const initialQuery = sessionStorage.getItem('bis_initial_ai_query');
    if (initialQuery) {
      onSendMessage(initialQuery, getBackendContext());
      sessionStorage.removeItem('bis_initial_ai_query');
    }
  }, []);

  const getBackendContext = (): Record<string, any> => {
    if (!activeCtx) return { page: 'ask-ai' };
    return {
      page: 'ask-ai',
      product: activeCtx.product || activeCtx.productName,
      standardId: activeCtx.standardId,
      industryScale: activeCtx.industryScale,
      active_step: activeCtx.activeStep,
    };
  };

  const handleRemoveContext = () => {
    setActiveCtx(null);
  };

  const handleNewChat = () => {
    createNewSession();
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  return (
    // STRICT HEIGHT LOCK: This prevents the main webpage from ever scrolling!
    <div 
      className="flex w-full bg-white relative overflow-hidden border-t border-slate-200"
      style={{ height: 'calc(100vh - 116px)' }} 
    >
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ============================================================== */}
      {/* 1. LEFT SIDEBAR (Independently Scrollable History) */}
      {/* ============================================================== */}
      <div className={`absolute inset-y-0 left-0 z-30 w-72 h-full bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col shrink-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Fixed Top Area (Never scrolls) */}
        <div className="p-4 shrink-0 flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm text-slate-800 rounded-full font-bold text-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-slate-500 hover:bg-slate-200 rounded-full lg:hidden ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Middle Area (Only this box scrolls on the left) */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
          <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 mt-2">Recent</p>
          
          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 italic">No recent chats</p>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer group transition-all ${
                  activeSessionId === session.id
                    ? 'bg-bis-100/70 text-bis-900 font-bold'
                    : 'hover:bg-slate-200/50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate text-sm tracking-tight">{session.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. RIGHT CHAT AREA (Independently Scrollable Messages) */}
      {/* ============================================================== */}
      <div className="flex-1 h-full flex flex-col bg-white relative min-w-0 overflow-hidden">
        
        {/* Fixed Context Header (Never scrolls) */}
        <div className="absolute top-0 inset-x-0 z-10 flex items-center gap-3 p-4 pointer-events-none">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-full lg:hidden pointer-events-auto shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {activeCtx && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-bis-200 text-bis-900 rounded-full text-xs font-semibold shadow-sm pointer-events-auto">
              <Tag className="w-3.5 h-3.5 text-bis-600 shrink-0" />
              <span className="truncate">
                Context: <strong className="font-bold">{activeCtx.productName || activeCtx.standardId}</strong>
              </span>
              <button 
                onClick={handleRemoveContext}
                className="ml-1 p-0.5 hover:bg-bis-100 rounded-full text-slate-400 hover:text-bis-700 transition-colors shrink-0"
                title="Remove context and start a general chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Messages Area (Only this box scrolls on the right) */}
        <div className="flex-1 overflow-y-auto w-full pt-16 pb-36 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-bis-50 to-amber-50 border border-amber-100 flex items-center justify-center mb-6 shadow-sm">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                How can I help with your BIS Compliance?
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8">
                Ask me about Indian Standards (IS), mandatory certification rules, testing guidelines, or general compliance requirements.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                <button 
                  onClick={() => onSendMessage("What is the difference between ISI Mark and Compulsory Registration Scheme (CRS)?", getBackendContext())}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-bis-300 hover:bg-slate-50 text-left transition-all group shadow-sm"
                >
                  <p className="text-sm font-bold text-slate-700 group-hover:text-bis-900 leading-snug">Explain the difference between ISI Mark and CRS</p>
                </button>
                <button 
                  onClick={() => onSendMessage("Which products require mandatory BIS certification in India?", getBackendContext())}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-bis-300 hover:bg-slate-50 text-left transition-all group shadow-sm"
                >
                  <p className="text-sm font-bold text-slate-700 group-hover:text-bis-900 leading-snug">List products needing mandatory certification</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-6">
              <MessageList
                messages={messages}
                isLoading={isLoading}
                onRetry={onRetry}
                onStartProductGuide={onStartProductGuide}
              />
            </div>
          )}
        </div>

        {/* Fixed Input Area (Never scrolls, stays pinned to bottom) */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-4">
          <div className="max-w-3xl mx-auto relative shadow-[0_0_40px_rgba(0,0,0,0.05)] rounded-3xl border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-bis-500 transition-all overflow-hidden">
            <ChatInput
              onSendMessage={(msg) => onSendMessage(msg, getBackendContext())}
              onSendAttachment={onSendAttachment}
              isLoading={isLoading}
            />
          </div>
          <p className="text-center text-[10px] sm:text-xs text-slate-400 font-medium mt-3">
            Manak Setu AI can make mistakes. Always verify compliance rules with official BIS notifications.
          </p>
        </div>

      </div>
    </div>
  );
};