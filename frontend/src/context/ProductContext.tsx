import React, { createContext, useContext, useState, useCallback } from 'react';
import { ProductProfile, ProductCertificationGuideData } from '../types/compliance';
import { Citation } from '../types/chat';
import { sendChatMessage, sendMultimodalMessage } from '../services/api';
import { generateProductCertificationGuideData } from '../services/complianceParser';
import { useLanguage } from './LanguageContext';

interface ProductContextType {
  productProfile: ProductProfile;
  guideData: ProductCertificationGuideData | null;
  activeStep: number;
  isLoading: boolean;
  errorMessage: string | null;
  setActiveStep: (step: number) => void;
  updateProductProfile: (updated: Partial<ProductProfile>) => void;
  startJourney: (query: string, file?: File) => Promise<void>;
  askContextualAI: (question: string, file?: File) => Promise<{ reply: string; citations: Citation[] }>;
  resetJourney: () => void;
}

const defaultProfile: ProductProfile = {
  name: '',
  category: 'Electrical & Electronics',
  industryScale: 'micro',
  isForeign: false,
  manufacturingLocation: 'Domestic Facility (India)',
  modelVarieties: 'Standard Domestic Line',
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [productProfile, setProductProfile] = useState<ProductProfile>(defaultProfile);
  const [guideData, setGuideData] = useState<ProductCertificationGuideData | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => `product_session_${Date.now()}`);

  const updateProductProfile = useCallback((updated: Partial<ProductProfile>) => {
    setProductProfile((prev) => {
      const next = { ...prev, ...updated };
      if (guideData) {
        setGuideData((prevGuide) => prevGuide ? { ...prevGuide, productProfile: next } : null);
      }
      return next;
    });
  }, [guideData]);

  const startJourney = useCallback(async (query: string, file?: File) => {
    const trimmed = query.trim();
    if (!trimmed && !file) return;

    setIsLoading(true);
    setErrorMessage(null);

    // Update product name in profile if not already set
    if (trimmed) {
      setProductProfile((prev) => ({
        ...prev,
        name: prev.name || trimmed.slice(0, 50),
      }));
    }

    try {
      let response;
      if (file) {
        response = await sendMultimodalMessage(sessionId, trimmed, file, language);
      } else {
        response = await sendChatMessage(sessionId, trimmed, language);
      }

      const parsedData = generateProductCertificationGuideData(
        trimmed || (file ? `Compliance analysis for ${file.name}` : 'Product Consultation'),
        response.reply,
        response.citations,
        file?.name || response.filename,
        productProfile
      );

      setGuideData(parsedData);
      setActiveStep(1);
    } catch (err: any) {
      console.error('Failed to start product certification guide:', err);
      const msg = err.message || 'Unable to connect to BIS Compliance Engine.';
      setErrorMessage(msg);

      const fallbackData = generateProductCertificationGuideData(
        trimmed,
        `?? **Notice**: ${msg}\n\n*Please ensure your FastAPI server is running with 'python api_server.py' on port 8000.*`,
        [],
        file?.name,
        productProfile
      );
      setGuideData(fallbackData);
      setActiveStep(1);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, language, productProfile]);

  const askContextualAI = useCallback(async (
    question: string, 
    file?: File
  ): Promise<{ reply: string; citations: Citation[] }> => {
    const currentProductName = productProfile.name || guideData?.productProfile.name || 'Product';
    const contextualPrompt = `[Context: Product = "${currentProductName}", Step ${activeStep}] ${question}`;

    if (file) {
      const res = await sendMultimodalMessage(sessionId, contextualPrompt, file, language);
      return {
        reply: res.reply,
        citations: res.citations || [],
      };
    } else {
      const res = await sendChatMessage(sessionId, contextualPrompt, language);
      return {
        reply: res.reply,
        citations: res.citations || [],
      };
    }
  }, [sessionId, language, productProfile, guideData, activeStep]);

  const resetJourney = useCallback(() => {
    setGuideData(null);
    setProductProfile(defaultProfile);
    setActiveStep(1);
    setErrorMessage(null);
  }, []);

  return (
    <ProductContext.Provider
      value={{
        productProfile,
        guideData,
        activeStep,
        isLoading,
        errorMessage,
        setActiveStep,
        updateProductProfile,
        startJourney,
        askContextualAI,
        resetJourney,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};
