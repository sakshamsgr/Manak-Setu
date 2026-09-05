import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  X, 
  RotateCcw, 
  Tag, 
  ChevronRight, 
  Layers
} from 'lucide-react';
import { ChatMessage, ChatSession } from '../../types/chat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useLanguage } from '../../context/LanguageContext';

export interface PersistentAssistantContext {
  tab: 'home' | 'estimator' | 'consumer';
  productName?: string;
  activeStep?: number;
  industryScale?: string;
}

interface PersistentAiAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string, context?: Record<string, any>) => void;
  onSendAttachment: (message: string, file: File) => void;
  onClearChat: () => void;
  onRetry?: () => void;
  activeSession?: ChatSession;
  contextData?: PersistentAssistantContext;
}

export const PersistentAiAssistant: React.FC<PersistentAiAssistantProps> = ({
  isOpen,
  onToggle,
  onClose,
  messages,
  isLoading,
  onSendMessage,
  onSendAttachment,
  onClearChat,
  onRetry,
  activeSession,
  contextData,
}) => {
  const { t } = useLanguage();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Context-sensitive quick suggestions
  const getContextualPrompts = () => {
    if (contextData?.tab === 'home' && contextData.productName) {
      return [
        `What testing parameters are compulsory for ${contextData.productName}?`,
        `What documents are required for ${contextData.productName} BIS filing?`,
        `What is the factory audit checklist for this product?`,
      ];
    }
    if (contextData?.tab === 'estimator') {
      return [
        'How is the 50% concession for Micro and Startup enterprises calculated?',
        'What are the mandatory inspection charges for Scheme-I?',
        'Are lab testing charges included in the BIS annual licence fee?',
      ];
    }
    if (contextData?.tab === 'consumer') {
      return [
        'How do I verify a 6-digit HUID code on gold jewellery via the BIS Care app?',
        'What should a consumer do if an ISI-certified product is defective?',
        'Which everyday products legally require mandatory ISI certification?',
      ];
    }
    return [
      'Which products have mandatory Quality Control Orders (QCO) in India?',
      'What is the difference between BIS ISI mark and Compulsory Registration Scheme (CRS)?',
      'How to apply for an Indian Standard certificate under e-BIS Manakonline?',
    ];
  };

  const contextualPrompts = getContextualPrompts();

  // Build the payload context object passed to backend RAG
  const getBackendContext = (): Record<string, any> => {
    const ctx: Record<string, any> = {
      active_tab: contextData?.tab || 'home',
    };
    if (contextData?.productName) {
      ctx.product_name = contextData.productName;
    }
    if (contextData?.activeStep) {
      ctx.active_step = contextData.activeStep;
    }
    if (contextData?.industryScale) {
      ctx.industry_scale = contextData.industryScale;
    }
    return ctx;
  };

  const handleSendPrompt = (promptText: string) => {
    onSendMessage(promptText, getBackendContext());
  };

  return (
    <>
      {/* 1. Permanent Floating "✨ Ask Manak Setu AI" Control (Lower-Right Corner) */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 select-none print:hidden">
        <button
          onClick={onToggle}
          aria-label={isOpen ? t('assistant.close') || 'Close Assistant' : '✨ Ask Manak Setu AI'}
          className={`group relative flex items-center justify-center rounded-full shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isOpen
              ? 'w-11 h-11 bg-slate-900 text-slate-300 border-2 border-slate-700 hover:bg-slate-800 hover:text-white'
              : 'px-4 py-2.5 bg-gradient-to-r from-bis-900 via-bis-850 to-slate-900 text-white border border-amber-400/80 shadow-bis-950/30 hover:shadow-bis-900/40 hover:border-amber-400'
          }`}
          title={isOpen ? t('assistant.close') || 'Close Assistant' : '✨ Ask Manak Setu AI'}
        >
          {isOpen ? (
            <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wide text-amber-300 font-sans">
                ✨ Ask Manak Setu AI
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden animate-fade-in"
        />
      )}

      {/* 2. Right-Side Persistent Assistant Drawer Panel */}
      {isOpen && (
        <aside
          aria-label="BIS AI Assistant Panel"
          className="fixed z-50 flex flex-col bg-white border border-slate-200/90 shadow-2xl overflow-hidden transition-all duration-300 animate-slide-in
            inset-x-3 bottom-3 top-16 rounded-2xl
            sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[410px] sm:max-w-[calc(100vw-2rem)] sm:h-[600px] sm:max-h-[calc(100vh-5rem)] sm:rounded-2xl"
        >
          {/* Panel Header Strip */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-bis-800 text-amber-400 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xs sm:text-sm text-white tracking-tight">
                    {t('assistant.title') || 'BIS AI Compliance Assistant'}
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300 truncate max-w-[200px]">
                  {activeSession?.title || 'National Standards & Regulatory Advisory'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('assistant.resetChat') || 'Clear Conversation'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('assistant.close') || 'Close Assistant'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context Bar */}
          <div className="px-3.5 py-1.5 bg-bis-50/70 border-b border-bis-100 flex items-center justify-between text-[11px] text-bis-900 shrink-0">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <Tag className="w-3 h-3 text-bis-700 shrink-0" />
              {contextData?.tab === 'home' && contextData.productName ? (
                <span className="truncate">
                  <strong>{contextData.productName}</strong>
                  {contextData.activeStep ? ` • Step ${contextData.activeStep}` : ''}
                </span>
              ) : contextData?.tab === 'estimator' ? (
                <span>{t('assistant.contextEstimator') || 'Fee Estimator Context'}</span>
              ) : contextData?.tab === 'consumer' ? (
                <span>{t('assistant.contextConsumer') || 'Consumer Help & Hallmarking Context'}</span>
              ) : (
                <span>{t('assistant.contextGeneral') || 'General Standards Context'}</span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shrink-0">
              {t('common.online') || 'Online'}
            </span>
          </div>

          {/* Quick Contextual Question Pills (shown if fewer than 3 messages) */}
          {messages.length <= 2 && (
            <div className="p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto custom-scrollbar flex gap-1.5 shrink-0">
              {contextualPrompts.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendPrompt(q)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-bis-300 text-slate-700 hover:text-bis-900 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                  <span className="truncate max-w-[200px]">{q}</span>
                </button>
              ))}
            </div>
          )}

          {/* Messages Stream */}
          <MessageList
            messages={messages}
            isLoading={isLoading}
            onRetry={onRetry}
          />

          {/* Input Box */}
          <ChatInput
            onSendMessage={(msg) => onSendMessage(msg, getBackendContext())}
            onSendAttachment={onSendAttachment}
            isLoading={isLoading}
          />
        </aside>
      )}
    </>
  );
};
