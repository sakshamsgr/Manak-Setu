import React from 'react';
import { 
  MessageSquarePlus, 
  Calculator, 
  BookOpen, 
  FlaskConical, 
  Info, 
  Trash2, 
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Smartphone,
  FileCheck2
} from 'lucide-react';
import { ChatSession } from '../../types/chat';

export type ActiveTab = 'chat' | 'estimator' | 'library' | 'labs' | 'about';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }> = [
    {
      id: 'chat',
      label: 'Chat Assistant',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'estimator',
      label: 'Fee & Cost Estimator',
      icon: <Calculator className="w-4 h-4" />,
      badge: 'MSME',
    },
    {
      id: 'library',
      label: 'Standards Library',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'labs',
      label: 'Lab Directory',
      icon: <FlaskConical className="w-4 h-4" />,
    },
    {
      id: 'about',
      label: 'About BIS & Schemes',
      icon: <Info className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-30 w-72 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* New Chat Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            onClick={() => {
              onNewSession();
              handleNavClick('chat');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-bis-700 hover:bg-bis-600 active:bg-bis-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md transition-all group"
          >
            <MessageSquarePlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>New Consultation</span>
          </button>
        </div>

        {/* Primary Navigation */}
        <div className="p-3 border-b border-slate-800 space-y-1">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Services & Tools
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-bis-800 text-white shadow-inner font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Chat Sessions History */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          <div className="flex items-center justify-between px-3 py-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Recent Consultations
            </span>
            <span className="text-[10px] text-slate-500">{sessions.length}</span>
          </div>

          <div className="space-y-1">
            {sessions.map((session) => {
              const isSelected = activeSessionId === session.id && activeTab === 'chat';
              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-amber-300 font-medium'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectSession(session.id);
                      handleNavClick('chat');
                    }}
                    className="flex-1 text-left truncate flex items-center gap-2 pr-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{session.title}</span>
                  </button>

                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-opacity"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Official Portals Footer Links */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-xs space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">
            Official BIS Portals
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <a
              href="https://www.manakonline.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 transition-colors"
            >
              <FileCheck2 className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">Manakonline</span>
            </a>
            <a
              href="https://bis.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">e-BIS Portal</span>
            </a>
          </div>

          <div className="pt-1 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>BIS Act 2016 Compliant</span>
            <span className="text-amber-400/80">v1.0 PWA</span>
          </div>
        </div>
      </aside>
    </>
  );
};
