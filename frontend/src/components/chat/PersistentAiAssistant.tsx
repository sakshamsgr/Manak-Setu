import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  X, 
  RotateCcw, 
  Tag, 
  ChevronRight, 
  Layers,
  GripHorizontal
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

// Default desktop dimensions (sm:w-[410px] sm:h-[600px])
const DEFAULT_WIDTH = 410;
const DEFAULT_HEIGHT = 600;
const MIN_WIDTH = 340;
const MIN_HEIGHT = 380;

const getClampedDimensions = (w: number, h: number) => {
  if (typeof window === 'undefined') return { width: w, height: h };
  const maxW = Math.max(MIN_WIDTH, Math.min(960, window.innerWidth - 32));
  const maxH = Math.max(MIN_HEIGHT, Math.min(960, window.innerHeight - 48));
  return {
    width: Math.min(Math.max(w, MIN_WIDTH), maxW),
    height: Math.min(Math.max(h, MIN_HEIGHT), maxH),
  };
};

const getClampedPosition = (x: number, y: number, w: number, h: number) => {
  if (typeof window === 'undefined') return { x, y };
  const maxX = Math.max(8, window.innerWidth - w - 8);
  const maxY = Math.max(8, window.innerHeight - h - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
};

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

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  // Resizable dimensions (width & height)
  const [size, setSize] = useState<{ width: number; height: number }>(() => {
    if (typeof window === 'undefined') return { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };
    try {
      const saved = sessionStorage.getItem('bis_assistant_size');
      if (saved) {
        const parsed = JSON.parse(saved);
        return getClampedDimensions(parsed.width, parsed.height);
      }
    } catch {}
    return getClampedDimensions(DEFAULT_WIDTH, DEFAULT_HEIGHT);
  });

  // Movable position coordinates (x & y)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    if (typeof window === 'undefined') return { x: 100, y: 100 };
    try {
      const saved = sessionStorage.getItem('bis_assistant_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        return getClampedPosition(parsed.x, parsed.y, DEFAULT_WIDTH, DEFAULT_HEIGHT);
      }
    } catch {}
    const initW = Math.min(DEFAULT_WIDTH, window.innerWidth - 32);
    const initH = Math.min(DEFAULT_HEIGHT, window.innerHeight - 48);
    return {
      x: Math.max(8, window.innerWidth - initW - 24),
      y: Math.max(8, window.innerHeight - initH - 24),
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

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

  // Adjust bounds on window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (!mobile) {
        setSize((prev) => {
          const clamped = getClampedDimensions(prev.width, prev.height);
          setPosition((pos) => getClampedPosition(pos.x, pos.y, clamped.width, clamped.height));
          return clamped;
        });
      }
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Move behavior (drag header to move)
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsDragging(true);
    document.body.style.userSelect = 'none';
  };

  const handleHeaderTouchStart = (e: React.TouchEvent) => {
    if (isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    const touch = e.touches[0];
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      originX: position.x,
      originY: position.y,
    };
    setIsDragging(true);
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newPos = getClampedPosition(
        dragRef.current.originX + dx,
        dragRef.current.originY + dy,
        size.width,
        size.height
      );
      setPosition(newPos);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragRef.current || !e.touches[0]) return;
      e.preventDefault();
      const touch = e.touches[0];
      const dx = touch.clientX - dragRef.current.startX;
      const dy = touch.clientY - dragRef.current.startY;
      const newPos = getClampedPosition(
        dragRef.current.originX + dx,
        dragRef.current.originY + dy,
        size.width,
        size.height
      );
      setPosition(newPos);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      dragRef.current = null;
      document.body.style.userSelect = '';
      try {
        sessionStorage.setItem('bis_assistant_pos', JSON.stringify(position));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
      document.body.style.userSelect = '';
    };
  }, [isDragging, size.width, size.height, position]);

  // Resize behavior (drag corners or edges to resize)
  type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r';

  const resizeRef = useRef<{
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    originX: number;
    originY: number;
  } | null>(null);

  const handleResizeStart = (handle: ResizeHandle, clientX: number, clientY: number) => {
    if (isMobile) return;
    resizeRef.current = {
      handle,
      startX: clientX,
      startY: clientY,
      startW: size.width,
      startH: size.height,
      originX: position.x,
      originY: position.y,
    };
    setIsResizing(true);
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleResizeMove = (clientX: number, clientY: number) => {
      if (!resizeRef.current) return;
      const { handle, startX, startY, startW, startH, originX, originY } = resizeRef.current;
      const dx = clientX - startX;
      const dy = clientY - startY;

      const minW = MIN_WIDTH;
      const maxW = Math.max(minW, Math.min(960, window.innerWidth - 32));
      const minH = MIN_HEIGHT;
      const maxH = Math.max(minH, Math.min(960, window.innerHeight - 48));

      let newW = startW;
      let newH = startH;
      let newX = originX;
      let newY = originY;

      if (handle.includes('r')) {
        newW = Math.min(Math.max(startW + dx, minW), maxW);
        if (newX + newW > window.innerWidth - 8) {
          newW = Math.max(minW, window.innerWidth - 8 - newX);
        }
      }

      if (handle.includes('l')) {
        const rawW = startW - dx;
        const clampedW = Math.min(Math.max(rawW, minW), maxW);
        const actualDeltaX = startW - clampedW;
        const proposedX = originX + actualDeltaX;
        if (proposedX >= 8) {
          newW = clampedW;
          newX = proposedX;
        } else {
          newX = 8;
          newW = Math.max(minW, originX + startW - 8);
        }
      }

      if (handle.includes('b')) {
        newH = Math.min(Math.max(startH + dy, minH), maxH);
        if (newY + newH > window.innerHeight - 8) {
          newH = Math.max(minH, window.innerHeight - 8 - newY);
        }
      }

      if (handle.includes('t')) {
        const rawH = startH - dy;
        const clampedH = Math.min(Math.max(rawH, minH), maxH);
        const actualDeltaY = startH - clampedH;
        const proposedY = originY + actualDeltaY;
        if (proposedY >= 8) {
          newH = clampedH;
          newY = proposedY;
        } else {
          newY = 8;
          newH = Math.max(minH, originY + startH - 8);
        }
      }

      setSize({ width: newW, height: newH });
      setPosition({ x: newX, y: newY });
    };

    const onMouseMove = (e: MouseEvent) => {
      handleResizeMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        e.preventDefault();
        handleResizeMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onResizeEnd = () => {
      setIsResizing(false);
      resizeRef.current = null;
      document.body.style.userSelect = '';
      try {
        sessionStorage.setItem('bis_assistant_size', JSON.stringify(size));
        sessionStorage.setItem('bis_assistant_pos', JSON.stringify(position));
      } catch {}
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onResizeEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onResizeEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onResizeEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onResizeEnd);
      document.body.style.userSelect = '';
    };
  }, [isResizing, size, position]);

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

      {/* 2. Persistent Assistant Panel (Movable & Resizable on Desktop) */}
      {isOpen && (
        <aside
          aria-label="BIS AI Assistant Panel"
          style={!isMobile ? {
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
          } : undefined}
          className={`fixed z-50 flex flex-col bg-white border border-slate-200/90 shadow-2xl overflow-hidden rounded-2xl ${
            isMobile
              ? 'inset-x-3 bottom-3 top-16 animate-slide-in'
              : ''
          } ${isDragging || isResizing ? 'transition-none select-none ring-2 ring-indigo-500/20' : 'transition-shadow duration-200'}`}
        >
          {/* Resize Handles (Desktop Only) */}
          {!isMobile && (
            <>
              {/* Corner Handles */}
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('tl', e.clientX, e.clientY); }}
                className="absolute -top-1.5 -left-1.5 w-4 h-4 cursor-nwse-resize z-50 group flex items-center justify-center"
                title="Resize"
              >
                <div className="w-2 h-2 rounded-full bg-slate-400/0 group-hover:bg-indigo-500/60 transition-colors" />
              </div>

              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('tr', e.clientX, e.clientY); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 cursor-nesw-resize z-50 group flex items-center justify-center"
                title="Resize"
              >
                <div className="w-2 h-2 rounded-full bg-slate-400/0 group-hover:bg-indigo-500/60 transition-colors" />
              </div>

              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('bl', e.clientX, e.clientY); }}
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 cursor-nesw-resize z-50 group flex items-center justify-center"
                title="Resize"
              >
                <div className="w-2 h-2 rounded-full bg-slate-400/0 group-hover:bg-indigo-500/60 transition-colors" />
              </div>

              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('br', e.clientX, e.clientY); }}
                className="absolute -bottom-1 -right-1 w-5 h-5 cursor-nwse-resize z-50 group flex items-end justify-end p-0.5"
                title="Resize"
              >
                {/* Subtle native-like corner grip dots / lines */}
                <svg width="8" height="8" viewBox="0 0 8 8" className="text-slate-400/70 group-hover:text-indigo-600 transition-colors pointer-events-none">
                  <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Edge Handles */}
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('t', e.clientX, e.clientY); }}
                className="absolute -top-1 left-4 right-4 h-2 cursor-ns-resize z-40"
                title="Resize"
              />
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('b', e.clientX, e.clientY); }}
                className="absolute -bottom-1 left-4 right-4 h-2 cursor-ns-resize z-40"
                title="Resize"
              />
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('l', e.clientX, e.clientY); }}
                className="absolute -left-1 top-4 bottom-4 w-2 cursor-ew-resize z-40"
                title="Resize"
              />
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('r', e.clientX, e.clientY); }}
                className="absolute -right-1 top-4 bottom-4 w-2 cursor-ew-resize z-40"
                title="Resize"
              />
            </>
          )}

          {/* Panel Header Strip - Draggable to move */}
          <div 
            onMouseDown={handleHeaderMouseDown}
            onTouchStart={handleHeaderTouchStart}
            className={`p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 select-none ${
              isMobile ? '' : 'cursor-grab active:cursor-grabbing'
            }`}
            title={isMobile ? undefined : 'Click and drag to reposition'}
          >
            <div className="flex items-center gap-2.5 pointer-events-none">
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
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={onClearChat}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('assistant.resetChat') || 'Clear Conversation'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={t('assistant.close') || 'Close Assistant'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Active Context Bar */}
          <div className="px-3.5 py-1.5 bg-bis-50/70 border-b border-bis-100 flex items-center justify-between text-[11px] text-bis-900 shrink-0 select-none">
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
            <div className="p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto custom-scrollbar flex gap-1.5 shrink-0 select-none">
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
