import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { GovBanner } from './components/layout/GovBanner';
import { Header, MainNavTab } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { InstallModal } from './components/layout/InstallModal';

import { HomeHero } from './components/home/HomeHero';
import { ProductCertificationGuide } from './components/guide/ProductCertificationGuide';
import { TrustStatsSection } from './components/home/TrustStatsSection';

import { ConsultationChatView } from './components/chat/ConsultationChatView';
import { StandardsQCOExplorer } from './components/compliance/StandardsQCOExplorer';
import { CertificationSchemesView } from './components/compliance/CertificationSchemesView';
import { LabDirectoryView } from './components/compliance/LabDirectoryView';
import { ConsumerHelpView } from './components/compliance/ConsumerHelpView';
import { FeeEstimatorView } from './components/estimator/FeeEstimatorView';

import { useChat } from './hooks/useChat';
import { useProductJourney } from './hooks/useProductJourney';
import { usePWAInstall } from './hooks/usePWAInstall';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('home');

  // General Chat Session Hook (for AI Assistant tab)
  const {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    deleteSession,
    clearCurrentMessages,
    messages,
    isLoading: isChatLoading,
    sendMessage: sendChatMessage,
    sendAttachment: sendChatAttachment,
  } = useChat();

  // 6-Stage Product Certification Guide Hook (Main Home Journey)
  const {
    guideData,
    isLoading: isJourneyLoading,
    startJourney,
    askContextualAI,
    resetJourney,
  } = useProductJourney();

  // PWA Installation Hook
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showInstallModal,
    setShowInstallModal,
    triggerInstall,
  } = usePWAInstall();

  // Handler for Hero Search submission -> starts 6-stage Product Certification Guide
  const handleHeroSubmit = (query: string, file?: File) => {
    setActiveTab('home');
    startJourney(query, file);
  };

  // Handler for jumping to general chat with a prompt
  const handleStartChatPrompt = (prompt: string) => {
    setActiveTab('chat');
    sendChatMessage(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-bis-200 selection:text-bis-950">
      {/* 1. Official Government of India Top Banner */}
      <GovBanner />

      {/* 2. Official BIS Header & Unified Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenInstallModal={() => setShowInstallModal(true)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        onInstallClick={triggerInstall}
      />

      {/* 3. Main Content Views */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* VIEW 1: HOME / PRODUCT CERTIFICATION GUIDE */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col space-y-8">
            {guideData ? (
              /* When user enters a product query, render the 6-Stage Product Certification Guide */
              <div className="px-4 sm:px-6 lg:px-8 py-8">
                <ProductCertificationGuide
                  guideData={guideData}
                  onRestart={resetJourney}
                  onAskAI={askContextualAI}
                  onJumpToEstimator={() => setActiveTab('estimator')}
                />
              </div>
            ) : (
              /* Default Home View: Flagship Hero Consultation Card + Trust Stats */
              <>
                <HomeHero
                  onSubmitQuery={handleHeroSubmit}
                  onSelectNavTab={setActiveTab}
                  isLoading={isJourneyLoading}
                />
                <TrustStatsSection />
              </>
            )}
          </div>
        )}

        {/* VIEW 2: AI CONSULTATION ASSISTANT (CHAT) */}
        {activeTab === 'chat' && (
          <ConsultationChatView
            sessions={sessions}
            activeSession={activeSession}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={createNewSession}
            onDeleteSession={deleteSession}
            messages={messages}
            isLoading={isChatLoading}
            onSendMessage={sendChatMessage}
            onSendAttachment={sendChatAttachment}
            onClearChat={clearCurrentMessages}
          />
        )}

        {/* VIEW 3: STANDARDS & QCO FINDER */}
        {activeTab === 'standards' && (
          <StandardsQCOExplorer onConsultStandard={handleStartChatPrompt} />
        )}

        {/* VIEW 4: CERTIFICATION ROADMAP & SCHEMES */}
        {activeTab === 'certification' && (
          <CertificationSchemesView onStartConsultation={handleStartChatPrompt} />
        )}

        {/* VIEW 5: TESTING & LABORATORIES DIRECTORY */}
        {activeTab === 'labs' && (
          <LabDirectoryView onConsultLab={handleStartChatPrompt} />
        )}

        {/* VIEW 6: STATUTORY FEE ESTIMATOR */}
        {activeTab === 'estimator' && (
          <FeeEstimatorView onAskAIAboutEstimate={handleStartChatPrompt} />
        )}

        {/* VIEW 7: CONSUMER VERIFICATION & HELP */}
        {activeTab === 'consumer' && (
          <ConsumerHelpView onStartConsultation={handleStartChatPrompt} />
        )}
      </main>

      {/* 4. Official Footer */}
      <Footer />

      {/* 5. PWA Guidance Modal */}
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

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
