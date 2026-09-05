import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Menu, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Compass,
  MessageSquare,
  BookOpen,
  FileCheck2,
  FlaskConical,
  Calculator,
  UserCheck,
  Gem,
  GitMerge
} from 'lucide-react';
import { checkBackendHealth } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { ProfileDropdown } from './ProfileDropdown';

export type MainNavTab = 
  | 'home' 
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
    { id: 'home', label: t('nav.home') || 'Product Guide', icon: <Compass className="w-4 h-4" /> },
    { id: 'estimator', label: t('nav.estimator') || 'Fee Estimator', icon: <Calculator className="w-4 h-4" />, badge: 'MSME' },
    { id: 'consumer', label: t('nav.consumer') || 'Consumer Help', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: MainNavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-200">
      {/* Main Top Header Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Left: Manak Setu Identity */}
        <div 
          onClick={() => handleTabClick('home')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-bis-950 font-serif">MANAK SETU</span>
              <span className="text-sm sm:text-base font-bold text-bis-700 font-sans">मानक सेतु</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {t('brand.tagAI') || 'BIS Compliance & Advisory Portal'}
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Functional 3-Language Toggle (EN | हिन्दी | বাংলা) */}
          <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                language === 'en'
                  ? 'bg-bis-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                language === 'hi'
                  ? 'bg-bis-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 rounded-lg transition-all text-[11px] ${
                language === 'bn'
                  ? 'bg-bis-900 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাংলা
            </button>
          </div>

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={onInstallClick}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-bis-800 to-bis-900 hover:from-bis-700 hover:to-bis-800 text-white shadow-sm transition-all transform active:scale-95"
              title="Install BIS AI Assistant PWA on mobile or desktop"
            >
              <Download className="w-3.5 h-3.5 text-amber-400 stroke-[2.5]" />
              <span>{t('brand.installApp')}</span>
            </button>
          )}

          {isInstalled && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('brand.appInstalled')}</span>
            </div>
          )}

          {/* PROFILE DROPDOWN (Integrated directly into the flex container) */}
          <ProfileDropdown />

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden transition-colors ml-1"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Desktop Unified Navigation Strip */}
      <div className="hidden lg:block bg-bis-900 text-white border-t border-bis-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-6 sm:gap-8">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold tracking-wide transition-all border-b-2 whitespace-nowrap ${
                    isActive
                      ? 'border-amber-400 text-white bg-bis-800/90 shadow-inner'
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
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 text-slate-100 border-t border-slate-800 p-4 space-y-3 animate-slide-up shadow-xl">
          <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          <div className="space-y-1">
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

          {/* Mobile Language Selector */}
          <div className="pt-2 border-t border-slate-800">
            <div className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Select Language / भाषा चुनें
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  language === 'en'
                    ? 'bg-bis-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  language === 'hi'
                    ? 'bg-bis-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`py-1.5 rounded-lg text-center transition-all ${
                  language === 'bn'
                    ? 'bg-bis-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>

          {/* Mobile PWA Install / Status Action */}
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            {!isInstalled ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onInstallClick();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-bis-950 font-extrabold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{t('brand.installApp') || 'Install Manak Setu App'}</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('brand.appInstalled') || 'App Installed (Offline Ready)'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};