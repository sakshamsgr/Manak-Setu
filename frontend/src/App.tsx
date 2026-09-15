import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Contexts
import { LanguageProvider } from './context/LanguageContext';
import { ProductProvider, useProductContext } from './context/ProductContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Components
import { LandingPage } from './components/auth/LandingPage';

// Layout Components
import { GovBanner } from './components/layout/GovBanner';
import { Header, MainNavTab } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { InstallModal } from './components/layout/InstallModal';

// Views
import { HomeHero } from './components/home/HomeHero';
import { ProductCertificationGuide } from './components/guide/ProductCertificationGuide';

import { FeeEstimatorView } from './components/estimator/FeeEstimatorView';
import { ConsumerHelpView } from './components/compliance/ConsumerHelpView';
import { HallmarkingView } from './components/hallmarking/HallmarkingView';
import { InfoGuideView } from './components/info/InfoGuideView';
import { AskManakSetuView } from './components/chat/AskManakSetuView';

// Hooks & Assistant
import { useChat } from './hooks/useChat';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PersistentAiAssistant, PersistentAssistantContext } from './components/chat/PersistentAiAssistant';

const getInitialTab = (): MainNavTab => {
  if (typeof window === 'undefined') return 'home';
  const hash = window.location.hash.replace('#', '').toLowerCase();
  
  if (hash.startsWith('info') || hash === 'hallmarking' || hash === 'estimator' || hash === 'consumer' || hash === 'home' || hash === 'ask-ai') {
    return (hash.startsWith('info') ? 'info' : hash) as MainNavTab;
  }
  const params = new URLSearchParams(window.location.search);
  const tabParam = params.get('tab')?.toLowerCase();
  
  if (tabParam === 'hallmarking' || tabParam === 'estimator' || tabParam === 'consumer' || tabParam === 'home' || tabParam === 'info' || tabParam === 'ask-ai') {
    return tabParam as MainNavTab;
  }
  const saved = sessionStorage.getItem('bis_active_tab');
  
  if (saved === 'hallmarking' || saved === 'estimator' || saved === 'consumer' || saved === 'home' || saved === 'info' || saved === 'ask-ai') {
    return saved as MainNavTab;
  }
  return 'home';
};

const AuthenticatedAppContent: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<MainNavTab>(getInitialTab);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const setActiveTab = (tab: MainNavTab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('bis_active_tab', tab);
      const currentHash = window.location.hash.replace('#', '').toLowerCase();
      if (!currentHash.startsWith(tab)) {
        window.location.hash = tab;
      }
    } catch {}
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      
      if (hash.startsWith('info') || hash === 'hallmarking' || hash === 'estimator' || hash === 'consumer' || hash === 'home' || hash === 'ask-ai') {
        const targetTab = (hash.startsWith('info') ? 'info' : hash) as MainNavTab;
        setActiveTabState(targetTab);
        try {
          sessionStorage.setItem('bis_active_tab', targetTab);
        } catch {}
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: MainNavTab; sectionId?: string }>;
      if (customEvent.detail?.tab) {
        setActiveTabState(customEvent.detail.tab);
        try {
          sessionStorage.setItem('bis_active_tab', customEvent.detail.tab);
        } catch {}
      }
    };
    window.addEventListener('manak_setu_navigate', handleCustomNav);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('manak_setu_navigate', handleCustomNav);
    };
  }, []);
  
  const {
    sessions, activeSession, activeSessionId, setActiveSessionId, createNewSession,
    deleteSession, clearCurrentMessages, messages, isLoading: isChatLoading,
    sendMessage: sendChatMessage, sendAttachment: sendChatAttachment,
    retryLastMessage,
  } = useChat();

  const { productProfile, guideData, activeStep, isLoading: isJourneyLoading, startJourney } = useProductContext();

  const { isInstallable, isInstalled, isIOS, showInstallModal, setShowInstallModal, triggerInstall } = usePWAInstall();

  const handleHeroSubmit = (query: string, file?: File) => {
    setActiveTab('home');
    startJourney(query, file);
  };

  const handleStartChatPrompt = (prompt?: string) => {
    setIsAssistantOpen(true);
    if (prompt) {
      sendChatMessage(prompt, {
        page: activeTab,
        tab: activeTab,
        stage: activeTab === 'home' ? activeStep : undefined,
        product: productProfile?.name || guideData?.productProfile?.name,
        product_name: productProfile?.name || guideData?.productProfile?.name,
        standardId: guideData?.standardDetails?.code,
        standard_id: guideData?.standardDetails?.code,
        standardName: guideData?.standardDetails?.title,
        standard_name: guideData?.standardDetails?.title,
        active_step: activeStep,
        industry_scale: productProfile?.industryScale,
        location: productProfile?.manufacturingLocation,
      });
    }
  };

  const assistantContext: PersistentAssistantContext = {
    tab: activeTab,
    page: activeTab,
    stage: activeTab === 'home' ? activeStep : undefined,
    product: productProfile?.name || guideData?.productProfile?.name,
    productName: productProfile?.name || guideData?.productProfile?.name,
    standardId: guideData?.standardDetails?.code,
    standardName: guideData?.standardDetails?.title,
    activeStep: activeStep,
    industryScale: productProfile?.industryScale,
    location: productProfile?.manufacturingLocation,
    userType: activeTab === 'hallmarking' ? 'consumer' : undefined,
    metal: activeTab === 'hallmarking' ? 'gold' : undefined,
    scheme: guideData?.certificationDetails?.scheme,
    qcoNotification: guideData?.certificationDetails?.qcoNotification,
    isMandatory: guideData?.certificationDetails?.isMandatory,
    routineTestsCount: guideData?.testingDetails?.routineTests?.length ?? guideData?.testingDetails?.requiredTests?.length,
    labsCount: guideData?.testingDetails?.laboratories?.length,
    documentsCount: Array.isArray(guideData?.documentChecklist) ? guideData.documentChecklist.length : undefined,
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-bis-200 selection:text-bis-950">
      <GovBanner />

      <Header
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
        onOpenInstallModal={() => setShowInstallModal(true)}
        isInstallable={isInstallable} 
        isInstalled={isInstalled} 
        onInstallClick={triggerInstall}
      />

      {/* Main Container dynamically adjusted for Full-screen Gemini view */}
      <main className={`flex-1 flex flex-col min-w-0 ${activeTab === 'ask-ai' ? 'h-[calc(100vh-80px)] overflow-hidden' : ''}`}>
        
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col space-y-8">
            {guideData ? (
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <ProductCertificationGuide 
                  onJumpToEstimator={() => setActiveTab('estimator')} 
                  onOpenAssistant={handleStartChatPrompt}
                />
              </div>
            ) : (
              <>
                <HomeHero onSubmitQuery={handleHeroSubmit} onSelectNavTab={setActiveTab} isLoading={isJourneyLoading} />
              
              </>
            )}
          </div>
        )}
        
        {/* Ask Manak Setu View now receives full session control */}
        {activeTab === 'ask-ai' && (
          <AskManakSetuView
            messages={messages}
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
            createNewSession={createNewSession}
            deleteSession={deleteSession}
            isLoading={isChatLoading}
            onSendMessage={sendChatMessage}
            onSendAttachment={sendChatAttachment}
            onClearChat={clearCurrentMessages}
            onRetry={retryLastMessage}
            contextData={assistantContext}
            onStartProductGuide={(query) => {
              setActiveTab('home');
              startJourney(query);
            }}
          />
        )}

        {activeTab === 'estimator' && <FeeEstimatorView onAskAIAboutEstimate={handleStartChatPrompt} />}
        {activeTab === 'consumer' && <ConsumerHelpView onNavigateToHallmarking={() => setActiveTab('hallmarking')} />}
        {activeTab === 'hallmarking' && <HallmarkingView onOpenAssistant={handleStartChatPrompt} />}
        {activeTab === 'info' && <InfoGuideView onOpenAssistant={handleStartChatPrompt} onSelectNavTab={setActiveTab} />}
      </main>

      {/* Hide footer dynamically if Ask AI is active to maximize chat space */}
      {activeTab !== 'ask-ai' && <Footer />}
      
      {activeTab === 'home' && guideData && activeStep >= 1 && activeStep <= 6 && (
        <PersistentAiAssistant
          isOpen={isAssistantOpen}
          onToggle={() => setIsAssistantOpen((prev) => !prev)}
          onClose={() => setIsAssistantOpen(false)}
          messages={messages}
          isLoading={isChatLoading}
          onSendMessage={sendChatMessage}
          onSendAttachment={sendChatAttachment}
          onClearChat={clearCurrentMessages}
          onRetry={retryLastMessage}
          activeSession={activeSession}
          contextData={assistantContext}
          onMaximize={() => {
            setIsAssistantOpen(false);
            setActiveTab('ask-ai');
          }}
        />
      )}

      <InstallModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
        isInstallable={isInstallable} 
        isIOS={isIOS} 
        onNativeInstall={triggerInstall} 
      />
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
        <Loader2 className="w-8 h-8 text-bis-900 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <AuthenticatedAppContent />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ProductProvider>
          <MainRouter />
        </ProductProvider>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;