import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Globe, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Compass,
  MessageSquare,
  BookOpen,
  FileCheck2,
  FlaskConical,
  Calculator,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { checkBackendHealth } from '../../services/api';

export type MainNavTab = 
  | 'home' 
  | 'chat' 
  | 'standards' 
  | 'certification' 
  | 'labs' 
  | 'estimator' 
  | 'consumer';

interface HeaderProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenInstallModal: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  onInstallClick: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: '??????' },
  { code: 'ta', label: 'Tamil', native: '?????' },
  { code: 'bn', label: 'Bengali', native: '?????' },
  { code: 'mr', label: 'Marathi', native: '?????' },
  { code: 'gu', label: 'Gujarati', native: '???????' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenInstallModal,
  isInstallable,
  isInstalled,
  onInstallClick,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ online: boolean; latency: number }>({
    online: true,
    latency: 18,
  });

  useEffect(() => {
    const checkStatus = async () => {
      const res = await checkBackendHealth();
      setServerStatus({ online: res.online, latency: res.latencyMs });
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems: Array<{ id: MainNavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'home', label: 'Compliance Navigator', icon: <Compass className="w-4 h-4" /> },
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'standards', label: 'Standards & QCO', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'certification', label: 'Certification Roadmap', icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'labs', label: 'Testing & Labs', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'estimator', label: 'Fee Estimator', icon: <Calculator className="w-4 h-4" />, badge: '50% MSME' },
    { id: 'consumer', label: 'Consumer Help', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: MainNavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
      {/* Main Top Header Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: BIS Brand & Official Emblem */}
        <div 
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          {/* BIS Emblem Badge */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-bis-800 to-bis-950 border border-amber-400/40 p-1 flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
              <circle cx="50" cy="50" r="44" stroke="#F59E0B" strokeWidth="3" />
              <path d="M28 65 L50 25 L72 65 Z" stroke="#FFFFFF" strokeWidth="6" strokeLinejoin="round" />
              <path d="M36 53 L64 53" stroke="#FFFFFF" strokeWidth="5" />
              <circle cx="50" cy="45" r="4" fill="#F59E0B" />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-bis-900 tracking-tight flex items-center gap-2">
                Bureau of Indian Standards
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded">
                  ???? AI Portal
                </span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              National Standards Body of India • Intelligent Compliance Assistant
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Real-time Backend Status Indicator */}
          <div 
            title={serverStatus.online ? `FastAPI Backend connected (${serverStatus.latency}ms)` : 'Backend connection unavailable'}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700"
          >
            {serverStatus.online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-emerald-700 font-mono text-[11px] font-semibold">RAG Server Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-rose-600 text-[11px] font-semibold">Backend Offline</span>
              </>
            )}
          </div>

          {/* Multi-language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5 text-bis-700" />
              <span>{LANGUAGES.find((l) => l.code === currentLang)?.native || 'English'}</span>
            </button>

            {isLangDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsLangDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-44 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-slide-up">
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Select Language / ????
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-bis-50 transition-colors ${
                        currentLang === lang.code ? 'font-bold text-bis-800 bg-bis-50' : 'text-slate-700'
                      }`}
                    >
                      <span>{lang.native}</span>
                      <span className="text-[10px] text-slate-400">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={onInstallClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white shadow-sm transition-all transform active:scale-95"
              title="Install BIS AI Assistant PWA on mobile or desktop"
            >
              <Download className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span className="hidden sm:inline">Install PWA</span>
              <span className="sm:hidden">Install</span>
            </button>
          )}

          {isInstalled && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>App Installed</span>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Unified Navigation Strip */}
      <div className="hidden lg:block bg-bis-900 text-white border-t border-bis-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide transition-all border-b-2 ${
                  isActive
                    ? 'border-amber-400 text-white bg-bis-800/80 shadow-inner'
                    : 'border-transparent text-slate-200 hover:text-white hover:bg-bis-800/50'
                }`}
              >
                <span className={isActive ? 'text-amber-400' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 text-slate-100 border-t border-slate-800 p-4 space-y-1 animate-slide-up shadow-xl">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-bis-700 text-white font-bold'
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
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
