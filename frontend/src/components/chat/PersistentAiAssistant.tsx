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
  tab: 'home' | 'product-guide' | 'estimator' | 'consumer' | 'hallmarking' | 'standards' | string;
  page?: string;
  stage?: string | number;
  product?: string;
  productName?: string;
  standardId?: string;
  standardName?: string;
  userType?: 'consumer' | 'business' | string;
  metal?: 'gold' | 'silver' | string;
  location?: string;
  activeStep?: number;
  industryScale?: string;
  scheme?: string;
  qcoNotification?: string;
  isMandatory?: boolean;
  routineTestsCount?: number;
  labsCount?: number;
  documentsCount?: number;
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
  const { t, language } = useLanguage();

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });

  // Floating Bubble state
  const [showBubble, setShowBubble] = useState(false);

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

  // 15-second timer for the floating "Ask with me" bubble
  useEffect(() => {
    if (isOpen) {
      setShowBubble(false);
      return;
    }
    const interval = setInterval(() => {
      setShowBubble(true);
      // Hide the bubble after 4 seconds
      setTimeout(() => setShowBubble(false), 4000);
    }, 15000); // Trigger every 15 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

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

  // Context-sensitive quick suggestions (Phase 4: Page Awareness)
  const getContextualPrompts = () => {
    const activePage = contextData?.page || contextData?.tab || 'home';
    const prodName = contextData?.product || contextData?.productName;
    const stageNum = contextData?.stage ?? contextData?.activeStep;

    if (activePage === 'hallmarking') {
      if (contextData?.userType === 'business') {
        return [
          'What is the 10-stage process for jewellers to get hallmarked?',
          'Are jewellers with annual turnover under ₹40 lakh exempt?',
          'How do I register my jewellery firm on Manakonline with zero fee?',
        ];
      }
      return [
        'How do I verify a 6-digit HUID code on gold jewellery?',
        'What are the 3 mandatory marks for gold jewellery under IS 1417?',
        'What compensation is a consumer entitled to under BIS Rule 49?',
      ];
    }
    if (activePage === 'estimator') {
      return [
        'How is the 50% concession for Micro and Startup enterprises calculated?',
        'What are the mandatory inspection charges for Scheme-I?',
        'Are lab testing charges included in the BIS annual licence fee?',
      ];
    }
    if (activePage === 'consumer') {
      return [
        'How do I verify an ISI mark and 7-digit CM/L number on BIS Care?',
        'What should a consumer do if an ISI-certified product is defective?',
        'How do I file an official grievance with BIS enforcement officers?',
      ];
    }
    if (activePage === 'home' || activePage === 'product-guide') {
      if (stageNum === 1) {
        return [
          prodName ? `What are the product profile and manufacturing requirements for ${prodName}?` : 'How do I determine the product category and scope for BIS certification?',
          prodName ? `Are there scale concessions (Micro/Startup) for ${prodName}?` : 'What fee concessions are available for Micro and Startup enterprises?',
          prodName ? `Does ${prodName} fall under Domestic certification or FMCS?` : 'What is the difference between Domestic licence and FMCS for foreign manufacturers?',
        ];
      }
      if (stageNum === 2) {
        return [
          prodName ? `Which Indian Standard applies to ${prodName} and what is its scope?` : 'How do I find the correct Indian Standard code for my product?',
          prodName ? `Are there recent amendments or revisions for ${prodName}'s standard?` : 'What do standard amendments and dual-numbering mean in BIS standards?',
          prodName ? `Why does this specific standard apply to ${prodName}?` : 'How does BIS decide which standard applies to a product?',
        ];
      }
      if (stageNum === 3) {
        return [
          prodName ? `Is ${prodName} covered by a mandatory Quality Control Order (QCO)?` : 'Which products are covered under mandatory Quality Control Orders?',
          prodName ? `Does ${prodName} come under Scheme-I (ISI Mark) or Scheme-II (CRS)?` : 'What is the difference between Scheme-I (ISI Mark) and Scheme-II (CRS)?',
          prodName ? `What are the Gazette order deadlines and penalties for ${prodName}?` : 'What are the legal penalties for manufacturing without mandatory BIS licence?',
        ];
      }
      if (stageNum === 4) {
        return [
          prodName ? `Which BIS-recognized laboratory can test ${prodName}?` : 'How do I find a BIS-recognized testing laboratory near me?',
          prodName ? `What routine vs type tests are required for ${prodName}?` : 'What is the difference between factory routine tests and independent lab tests?',
          prodName ? `What are the grouping guidelines for sample testing for ${prodName}?` : 'How does BIS grouping guidelines reduce testing costs for product varieties?',
        ];
      }
      if (stageNum === 5) {
        return [
          prodName ? `What statutory documents are required for ${prodName} filing?` : 'What documents are required to apply for BIS certification?',
          prodName ? `Is an equipment calibration certificate mandatory for ${prodName}?` : 'Why is NABL calibration mandatory for factory test equipment?',
          prodName ? `What are the factory layout drawing requirements for ${prodName}?` : 'What details must be shown in the factory layout drawing for BIS audit?',
        ];
      }
      if (stageNum === 6) {
        return [
          prodName ? `What are the statutory milestones for grant of licence for ${prodName}?` : 'What are the stages and milestones of the BIS certification process?',
          prodName ? `What happens during the official BIS on-site factory audit for ${prodName}?` : 'What should a manufacturer prepare for the BIS factory audit?',
          prodName ? `What is the timeline for grant of licence after test clearance for ${prodName}?` : 'How long does it take from application submission to grant of BIS licence?',
        ];
      }
      if (prodName) {
        return [
          `What Indian Standard applies to ${prodName}?`,
          `Is ${prodName} covered by a mandatory Quality Control Order (QCO)?`,
          `What are the factory audit requirements for this product?`,
        ];
      }
    }
    return [
      'Which products have mandatory Quality Control Orders (QCO) in India?',
      'What is the difference between BIS ISI mark and Compulsory Registration Scheme (CRS)?',
      'How to apply for an Indian Standard certificate under e-BIS Manakonline?',
    ];
  };

  const contextualPrompts = getContextualPrompts();

  // Build the structured payload context object passed to backend RAG
  const getBackendContext = (): Record<string, any> => {
    const pageVal = contextData?.page || contextData?.tab || 'home';
    const ctx: Record<string, any> = {
      page: pageVal,
      active_tab: pageVal,
      tab: pageVal,
      language,
    };
    const prod = contextData?.product || contextData?.productName;
    if (prod) {
      ctx.product = prod;
      ctx.product_name = prod;
    }
    const stg = contextData?.stage ?? contextData?.activeStep;
    if (stg !== undefined) {
      ctx.stage = stg;
      ctx.active_step = stg;
    }
    if (contextData?.standardId) {
      ctx.standardId = contextData.standardId;
      ctx.standard_id = contextData.standardId;
    }
    if (contextData?.standardName) {
      ctx.standardName = contextData.standardName;
      ctx.standard_name = contextData.standardName;
    }
    if (contextData?.userType) {
      ctx.userType = contextData.userType;
      ctx.user_type = contextData.userType;
    }
    if (contextData?.metal) {
      ctx.metal = contextData.metal;
    }
    if (contextData?.location) {
      ctx.location = contextData.location;
    }
    if (contextData?.industryScale) {
      ctx.industryScale = contextData.industryScale;
      ctx.industry_scale = contextData.industryScale;
    }
    if (contextData?.scheme) {
      ctx.scheme = contextData.scheme;
    }
    if (contextData?.qcoNotification) {
      ctx.qcoNotification = contextData.qcoNotification;
      ctx.qco_notification = contextData.qcoNotification;
    }
    if (contextData?.isMandatory !== undefined) {
      ctx.isMandatory = contextData.isMandatory;
      ctx.is_mandatory = contextData.isMandatory;
    }
    if (contextData?.routineTestsCount !== undefined) {
      ctx.routineTestsCount = contextData.routineTestsCount;
    }
    if (contextData?.labsCount !== undefined) {
      ctx.labsCount = contextData.labsCount;
    }
    if (contextData?.documentsCount !== undefined) {
      ctx.documentsCount = contextData.documentsCount;
    }
    return ctx;
  };

  const handleSendPrompt = (promptText: string) => {
    onSendMessage(promptText, getBackendContext());
  };

  return (
    <>
      {/* 1. Permanent Floating "✨ Ask Manak Setu AI" Control (Lower-Right Corner) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 select-none print:hidden">
        
        {/* 15-second Notification Bubble */}
        {!isOpen && showBubble && (
          <div className="relative animate-bounce bg-white text-bis-900 px-4 py-2 rounded-2xl shadow-xl border border-slate-200 font-bold text-sm mr-2 mb-1 z-50">
            Ask with me! ✨
            {/* Small triangle pointing down to the button */}
            <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white border-r-[6px] border-r-transparent filter drop-shadow-md"></div>
          </div>
        )}

        {/* Floating Button Container */}
        <div className="relative group">
          {/* Glowing Colorful Background (Shows on Hover) */}
          {!isOpen && (
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-emerald-400 to-blue-500 rounded-full blur-md opacity-0 group-hover:opacity-70 transition duration-500 pointer-events-none"></div>
          )}

          <button
            onClick={onToggle}
            aria-label={isOpen ? t('assistant.close') || 'Close Assistant' : '✨ Ask Manak Setu AI'}
            className={`relative flex items-center justify-center rounded-full shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
              isOpen
                ? 'w-11 h-11 bg-slate-900 text-slate-300 border-2 border-slate-700 hover:bg-slate-800 hover:text-white'
                : 'px-6 py-3.5 bg-gradient-to-r from-bis-900 via-bis-850 to-slate-900 text-white border-2 border-amber-400/80 shadow-bis-950/30 hover:-translate-y-1 hover:scale-105'
            }`}
            title={isOpen ? t('assistant.close') || 'Close Assistant' : '✨ Ask Manak Setu AI'}
          >
            {isOpen ? (
              <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-amber-300 font-sans">
                  ✨ Ask Manak Setu AI
                </span>
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
            )}
          </button>
        </div>
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
                className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-[60] group flex items-start justify-start p-1"
                title="Resize"
              >
                <div className="w-3 h-3 rounded-tl-xl bg-slate-400/0 group-hover:bg-indigo-500/60 transition-colors" />
              </div>

              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('tr', e.clientX, e.clientY); }}
                className="absolute top-0 right-0 w-6 h-6 cursor-nesw-resize z-[60] group flex items-start justify-end p-1"
                title="Resize"
              >
                <div className="w-3 h-3 rounded-tr-xl bg-slate-400/0 group-hover:bg-indigo-500/60 transition-colors" />
              </div>

              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('bl', e.clientX, e.clientY); }}
                className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-[60] group flex items-end justify-start p-1"
                title="Resize"
              >
                <div className="w-3 h-3 rounded-bl-xl bg-slate-400/0 group-hover:bg-indigo-500/60 transition-colors" />
              </div>

              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('br', e.clientX, e.clientY); }}
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-[60] group flex items-end justify-end p-1.5"
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
                className="absolute top-0 left-6 right-6 h-3 cursor-ns-resize z-[55]"
                title="Resize"
              />
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('b', e.clientX, e.clientY); }}
                className="absolute bottom-0 left-6 right-6 h-3 cursor-ns-resize z-[55]"
                title="Resize"
              />
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('l', e.clientX, e.clientY); }}
                className="absolute left-0 top-6 bottom-6 w-3 cursor-ew-resize z-[55]"
                title="Resize"
              />
              <div
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleResizeStart('r', e.clientX, e.clientY); }}
                className="absolute right-0 top-6 bottom-6 w-3 cursor-ew-resize z-[55]"
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
              {contextData?.tab === 'hallmarking' ? (
                <span>Hallmarking Context ({contextData.metal === 'silver' ? 'Silver IS 2112' : 'Gold IS 1417'})</span>
              ) : (contextData?.tab === 'home' || contextData?.tab === 'product-guide') && (contextData.product || contextData.productName) ? (
                <span className="truncate">
                  <strong>{contextData.product || contextData.productName}</strong>
                  {contextData.stage || contextData.activeStep ? ` • Stage ${contextData.stage || contextData.activeStep}` : ''}
                </span>
              ) : contextData?.tab === 'estimator' ? (
                <span>{t('assistant.contextEstimator') || 'Fee Estimator Context'}</span>
              ) : contextData?.tab === 'consumer' ? (
                <span>{t('assistant.contextConsumer') || 'Consumer Protection & Grievance Context'}</span>
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