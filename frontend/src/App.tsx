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
import { ConsultationChatView } from './components/chat/ConsultationChatView';
import { StandardsQCOExplorer } from './components/compliance/StandardsQCOExplorer';
import { CertificationSchemesView } from './components/compliance/CertificationSchemesView';
import { LabDirectoryView } from './components/compliance/LabDirectoryView';
import { HallmarkingView } from './components/hallmarking/HallmarkingView';
import { JourneyFlowchartView } from './components/flowchart/JourneyFlowchartView';
import { FeeEstimatorView } from './components/estimator/FeeEstimatorView';
import { ConsumerHelpView } from './components/compliance/ConsumerHelpView';

// Hooks
import { useChat } from './hooks/useChat';
import { usePWAInstall } from './hooks/usePWAInstall';

const AuthenticatedAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  
  const {
    sessions, activeSession, activeSessionId, setActiveSessionId, createNewSession,
    deleteSession, clearCurrentMessages, messages, isLoading: isChatLoading,
    sendMessage: sendChatMessage, sendAttachment: sendChatAttachment,
  } = useChat();

  const { guideData, isLoading: isJourneyLoading, startJourney } = useProductContext();

  const { isInstallable, isInstalled, isIOS, showInstallModal, setShowInstallModal, triggerInstall } = usePWAInstall();

  const handleHeroSubmit = (query: string, file?: File) => {
    setActiveTab('home');
    startJourney(query, file);
  };

  const handleStartChatPrompt = (prompt: string) => {
    setActiveTab('chat');
    sendChatMessage(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-bis-200 selection:text-bis-950">
      <GovBanner />

      <Header
        activeTab={activeTab} onSelectTab={setActiveTab} onOpenInstallModal={() => setShowInstallModal(true)}
        isInstallable={isInstallable} isInstalled={isInstalled} onInstallClick={triggerInstall}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col space-y-8">
            {guideData ? (
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <ProductCertificationGuide onJumpToEstimator={() => setActiveTab('estimator')} />
              </div>
            ) : (
              <>
                <HomeHero onSubmitQuery={handleHeroSubmit} onSelectNavTab={setActiveTab} isLoading={isJourneyLoading} />
                <TrustStatsSection />
              </>
            )}
          </div>
        )}
        {activeTab === 'chat' && (
          <ConsultationChatView
            sessions={sessions} activeSession={activeSession} activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId} onNewSession={createNewSession} onDeleteSession={deleteSession}
            messages={messages} isLoading={isChatLoading} onSendMessage={sendChatMessage}
            onSendAttachment={sendChatAttachment} onClearChat={clearCurrentMessages}
          />
        )}
        {activeTab === 'standards' && <StandardsQCOExplorer onConsultStandard={handleStartChatPrompt} />}
        {activeTab === 'certification' && <CertificationSchemesView onStartConsultation={handleStartChatPrompt} />}
        {activeTab === 'labs' && <LabDirectoryView onConsultLab={handleStartChatPrompt} />}
        {activeTab === 'hallmarking' && <HallmarkingView />}
        {activeTab === 'demonstration' && <JourneyFlowchartView />}
        {activeTab === 'estimator' && <FeeEstimatorView onAskAIAboutEstimate={handleStartChatPrompt} />}
        {activeTab === 'consumer' && <ConsumerHelpView />}
      </main>

      <Footer />
      <InstallModal isOpen={showInstallModal} onClose={() => setShowInstallModal(false)} isInstallable={isInstallable} isIOS={isIOS} onNativeInstall={triggerInstall} />
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