import React, { useState } from 'react';
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
import { TrustStatsSection } from './components/home/TrustStatsSection';
import { FeeEstimatorView } from './components/estimator/FeeEstimatorView';
import { ConsumerHelpView } from './components/compliance/ConsumerHelpView';

// Hooks & Assistant
import { useChat } from './hooks/useChat';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PersistentAiAssistant, PersistentAssistantContext } from './components/chat/PersistentAiAssistant';

const AuthenticatedAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
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
        tab: activeTab,
        product_name: productProfile?.name || guideData?.productProfile?.name,
        active_step: activeStep,
        industry_scale: productProfile?.industryScale,
      });
    }
  };

  const assistantContext: PersistentAssistantContext = {
    tab: activeTab,
    productName: productProfile?.name || guideData?.productProfile?.name,
    activeStep: activeStep,
    industryScale: productProfile?.industryScale,
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

      <main className="flex-1 flex flex-col min-w-0">
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
                <TrustStatsSection />
              </>
            )}
          </div>
        )}
        {activeTab === 'estimator' && <FeeEstimatorView onAskAIAboutEstimate={handleStartChatPrompt} />}
        {activeTab === 'consumer' && <ConsumerHelpView />}
      </main>

      <Footer />
      
      {/* Persistent AI Assistant Drawer & Floating Control */}
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
      />

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
