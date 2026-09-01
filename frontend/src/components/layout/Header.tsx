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
  Sparkles,
  UserCircle2,
  LogOut
} from 'lucide-react';
import { checkBackendHealth } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { AuthModal } from '../auth/AuthModal';

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

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenInstallModal,
  isInstallable,
  isInstalled,
  onInstallClick,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Authentication Modal & Session State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    try {
      const savedUser = localStorage.getItem('bis_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

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

  const handleAuthSuccess = (user: { name: string; email: string; role: string }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('bis_auth_user', JSON.stringify(user));
    } catch {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('bis_auth_user');
    } catch {}
  };

  const navItems: Array<{ id: MainNavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'home', label: t('navHome'), icon: <Compass className="w-4 h-4" /> },
    { id: 'chat', label: t('navChat'), icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'standards', label: t('navStandards'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'certification', label: t('navCertification'), icon: <FileCheck2 className="w-4 h-4" /> },
    { id: 'labs', label: t('navLabs'), icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'estimator', label: t('navEstimator'), icon: <Calculator className="w-4 h-4" />, badge: '50% MSME' },
    { id: 'consumer', label: t('navConsumer'), icon: <UserCheck className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: MainNavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
        {/* Main Top Header Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Left: Official BIS Brand with Official Logo */}
          <div 
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <img 
              src="/bis-logo.png" 
              alt="Bureau of Indian Standards - National Standards Body of India" 
              className="h-10 sm:h-12 w-auto max-w-[240px] sm:max-w-[320px] object-contain transition-transform group-hover:scale-[1.02]" 
            />
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
                  <span className="text-emerald-700 font-mono text-[11px] font-semibold">{t('ragServerActive')}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-rose-600 text-[11px] font-semibold">{t('ragServerOffline')}</span>
                </>
              )}
            </div>

            {/* Functional Language Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-bis-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  language === 'hi'
                    ? 'bg-bis-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
            </div>

            {/* User Login / Profile Pill Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-bis-50 border border-bis-200 text-bis-900 text-xs font-bold">
                <UserCircle2 className="w-4 h-4 text-bis-700 shrink-0" />
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="truncate max-w-[90px]">{currentUser.name}</span>
                  <span className="text-[9px] text-slate-500 font-normal">{currentUser.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1 hover:text-rose-600 transition-colors ml-0.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 hover:bg-slate-100 hover:border-slate-400 text-slate-700 transition-all shadow-2xs"
              >
                <UserCircle2 className="w-3.5 h-3.5 text-bis-700" />
                <span className="hidden sm:inline">Login / Sign Up</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}

            {/* PWA Install Button */}
            {!isInstalled && (
              <button
                onClick={onInstallClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white shadow-sm transition-all transform active:scale-95"
                title="Install BIS AI Assistant PWA on mobile or desktop"
              >
                <Download className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
                <span className="hidden sm:inline">{t('installPwa')}</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}

            {isInstalled && (
              <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('appInstalled')}</span>
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
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold tracking-wide transition-all border-b-2 ${
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

      {/* Render Authentication & OTP Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};