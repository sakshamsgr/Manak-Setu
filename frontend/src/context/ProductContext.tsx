import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { 
  ProductProfile, 
  ProductCertificationGuideData,
  TestItem,
  GroupingRuleItem,
  DocumentItem,
  ApplicationMilestone
} from '../types/compliance';
import { Citation } from '../types/chat';
import { 
  resolveProductGuide, 
  getTestingAndLabs, 
  getStandardDocuments, 
  getStandardProcess, 
  sendChatMessage, 
  sendMultimodalMessage, 
  ApiTimeoutError,
  SavedProductGuideItem,
  saveUserProductGuide,
  getUserSavedGuides,
  deleteUserSavedGuide
} from '../services/api';
import { generateProductCertificationGuideData } from '../services/complianceParser';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext'; // FIX: Imported useAuth for session tracking

interface ProductContextType {
  productProfile: ProductProfile;
  guideData: ProductCertificationGuideData | null;
  activeStep: number;
  isLoading: boolean;
  errorMessage: string | null;
  savedGuides: SavedProductGuideItem[];
  setActiveStep: (step: number) => void;
  updateProductProfile: (updated: Partial<ProductProfile>) => void;
  startJourney: (query: string, file?: File) => Promise<void>;
  retryLastJourney?: () => Promise<void>;
  clearError: () => void;
  askContextualAI: (question: string, file?: File, signal?: AbortSignal) => Promise<{ reply: string; citations: Citation[] }>;
  resetJourney: () => void;
  saveJourney: () => Promise<{ success: boolean; message: string }>;
  loadSavedGuide: (saved: SavedProductGuideItem) => void;
  deleteSavedGuide: (id: string) => Promise<void>;
  fetchSavedGuides: () => Promise<void>;
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
  const { language, t } = useLanguage();
  const { user } = useAuth(); // FIX: Hooked into AuthContext
  
  const [productProfile, setProductProfile] = useState<ProductProfile>(defaultProfile);
  const [guideData, setGuideData] = useState<ProductCertificationGuideData | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedGuides, setSavedGuides] = useState<SavedProductGuideItem[]>([]);
  // FIX: Made sessionId mutable so we can regenerate it on logout
  const [sessionId, setSessionId] = useState<string>(() => `product_session_${Date.now()}`);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<{ query: string; file?: File } | null>(null);

  useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
        activeAbortControllerRef.current = null;
      }
    };
  }, []);

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

    if (isLoading) return;

    lastQueryRef.current = { query: trimmed, file };

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    // Stamp this search so stale async responses from a previous product can be discarded.
    const searchStamp = Date.now();
    (controller as any)._searchStamp = searchStamp;

    setIsLoading(true);
    setErrorMessage(null);

    // Immediately clear regulatory state so stale data from the PREVIOUS product
    // does not remain visible while the new fetch is in-flight.
    setGuideData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        testingDetails: {
          ...prev.testingDetails,
          hasRegulatoryUpdates: false,
          regulatoryNoticeCount: 0,
          unmappedWarning: null,
        },
      };
    });

    // If query is a direct product name (e.g. from shortcut card), prioritize it over potentially stale state
    const isDirectProduct = Boolean(trimmed && !trimmed.toLowerCase().startsWith('compliance requirements for'));
    const targetProductName = isDirectProduct ? trimmed : (productProfile.name || trimmed);

    try {
      const resolved = await resolveProductGuide({
        query: trimmed,
        productName: targetProductName,
        industryCategory: productProfile.category,
        enterpriseScale: productProfile.industryScale,
        isForeign: productProfile.isForeign,
        language,
        signal: controller.signal,
      });

      if (!resolved || !resolved.found) {
        const fallbackMsg = resolved?.message || 'No details available yet. This information will be updated in future.';
        const emptyGuide: ProductCertificationGuideData = {
          query: trimmed,
          productProfile: {
            name: productProfile.name || trimmed,
            category: productProfile.category,
            industryScale: productProfile.industryScale,
            isForeign: productProfile.isForeign,
            manufacturingLocation: 'Domestic Facility (India)',
            subType: productProfile.subType,
            intendedUse: productProfile.intendedUse,
            keyMaterial: productProfile.keyMaterial,
            technicalSpecs: productProfile.technicalSpecs,
          },
          standardDetails: {
            code: 'Data Not Available',
            title: fallbackMsg,
            whyItApplies: 'We currently do not have the standards or QCO data for this specific product in our database. We will update this in the future.',
            scope: 'N/A',
            relatedStandards: [],
            officialSource: 'Bureau of Indian Standards',
            officialUrl: 'https://www.services.bis.gov.in',
          },
          certificationDetails: {
            isMandatory: false,
            applicability: 'Voluntary Certification',
            scheme: 'Scheme-I (ISI Mark)',
            qcoNotification: 'N/A',
            keyConditions: [],
            exemptions: [],
          },
          testingDetails: {
            requiredTests: [],
            routineTests: [],
            typeTests: [],
            laboratories: [],
            groupingRules: [],
            labInfo: 'Testing information currently unavailable.',
            samplingProtocol: 'N/A',
          },
          documentChecklist: [],
          applicationMilestones: [],
          rawMarkdownResponse: fallbackMsg,
          citations: [],
          timestamp: Date.now(),
          attachmentName: file?.name,
        };
        setGuideData(emptyGuide);
        setActiveStep(1);
        return;
      }

      const rawStandardId = resolved.standard.text_standard_id || resolved.standard.standard_number || '';
      // Clean up slashes, parentheses, and extra spaces so the backend parser can read it flawlessly
      const cleanStandardId = rawStandardId.replace(/\//g, '-').replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
      
      const [testingRes, docsRes, processRes] = await Promise.allSettled([
        getTestingAndLabs(cleanStandardId, controller.signal),
        getStandardDocuments(cleanStandardId, controller.signal),
        getStandardProcess(cleanStandardId, controller.signal),
      ]);

      let fileCitations: Citation[] = [];
      let rawAiReply = '';
      if (file) {
        try {
          const aiRes = await sendMultimodalMessage(sessionId, trimmed, file, language, controller.signal);
          fileCitations = aiRes.citations || [];
          rawAiReply = aiRes.reply || '';
        } catch (aiErr) {
          console.warn('Multimodal scan encountered error, proceeding with database records:', aiErr);
        }
      }

      const testingData = testingRes.status === 'fulfilled' ? testingRes.value : null;

      // Race-condition guard: if a newer search has already started (stamp mismatch),
      // discard this response to prevent stale data from a previous product overwriting
      // the current product's regulatory state.
      if ((activeAbortControllerRef.current as any)?._searchStamp !== searchStamp &&
          activeAbortControllerRef.current !== null) {
        return;
      }

      const routineTests: TestItem[] = (testingData?.routine_tests || []).map((t: any) => ({
        id: t.id,
        name: t.requirement || 'Routine Verification Test',
        type: 'Routine Test' as const,
        description: `${t.requirement}. Method: ${t.test_method || 'BIS standard method'}. Sample: ${t.sample_quantity || 'Production unit'}.`,
        clause: t.clause,
        testMethod: t.test_method,
        equipmentRequirement: t.equipment_requirement,
        frequency: t.frequency,
        sampleQuantity: t.sample_quantity,
        remarks: t.remarks,
        sourcePage: t.source_page,
        isUpdated: Boolean(t.is_updated),
        regulatoryUpdate: t.regulatory_update ? {
          notificationId: t.regulatory_update.notification_id,
          title: t.regulatory_update.title,
          message: t.regulatory_update.message,
          createdAt: t.regulatory_update.created_at,
          badge: t.regulatory_update.badge,
          source: t.regulatory_update.source,
        } : undefined,
        regulatorySource: t.regulatory_source,
      }));

      const typeTests: TestItem[] = (testingData?.type_tests || []).map((t: any) => ({
        id: t.id,
        name: t.requirement || 'Laboratory Type Test',
        type: (t.testing_type === 'Acceptance' ? 'Acceptance Test' : 'Type Test') as any,
        description: `${t.requirement}. Method: ${t.test_method || 'BIS standard method'}. Sample: ${t.sample_quantity || 'Specified batch'}.`,
        clause: t.clause,
        testMethod: t.test_method,
        equipmentRequirement: t.equipment_requirement,
        frequency: t.frequency,
        sampleQuantity: t.sample_quantity,
        remarks: t.remarks,
        sourcePage: t.source_page,
        isUpdated: Boolean(t.is_updated),
        regulatoryUpdate: t.regulatory_update ? {
          notificationId: t.regulatory_update.notification_id,
          title: t.regulatory_update.title,
          message: t.regulatory_update.message,
          createdAt: t.regulatory_update.created_at,
          badge: t.regulatory_update.badge,
          source: t.regulatory_update.source,
        } : undefined,
        regulatorySource: t.regulatory_source,
      }));

      const requiredTests = [...routineTests, ...typeTests];
      const labs = testingData?.laboratories || [];
      const rawGrouping = testingData?.grouping_rules || [];
      const groupingRules: GroupingRuleItem[] = rawGrouping.map((gr: any) => ({
        groupCode: gr.group_code || gr.groupCode || 'GROUP',
        groupName: gr.group_name || gr.groupName || 'Grouping Rule',
        condition: gr.condition || '',
        sampleRequirement: gr.sample_requirement || gr.sampleRequirement || '',
        preferredSample: gr.preferred_sample || gr.preferredSample || '',
        voltageRequirement: gr.voltage_requirement || gr.voltageRequirement || '',
        remarks: gr.remarks || '',
        sourcePage: gr.source_page || gr.sourcePage || undefined,
      }));

      const docsData = docsRes.status === 'fulfilled' ? docsRes.value : null;
      const documentChecklist: DocumentItem[] = (docsData?.documents || []).map((d: any, idx: number) => {
        let category: 'Legal' | 'Technical' | 'Quality Control' | 'Testing' = 'Technical';
        const nameLower = (d.document_name || '').toLowerCase();
        if (nameLower.includes('form') || nameLower.includes('incorporation') || nameLower.includes('msme') || nameLower.includes('pan') || nameLower.includes('gst')) {
          category = 'Legal';
        } else if (nameLower.includes('test') || nameLower.includes('lab')) {
          category = 'Testing';
        } else if (nameLower.includes('calibration') || nameLower.includes('quality') || nameLower.includes('qc') || nameLower.includes('inspection')) {
          category = 'Quality Control';
        }
        return {
          id: `doc_${d.id || idx + 1}`,
          title: d.document_name,
          category,
          description: d.description || '',
          required: (d.required_status || '').trim().toLowerCase() === 'required',
          requiredStatus: d.required_status || (d.required_status === 'required' ? 'Required' : undefined),
          applicableWhen: d.applicable_when,
          responsibleParty: d.responsible_party,
          sourceUrl: d.source_url,
          status: 'Not Uploaded' as const,
        };
      });

      const processData = processRes.status === 'fulfilled' ? processRes.value : null;
      let applicationMilestones: ApplicationMilestone[] = (processData?.steps || []).map((s: any, idx: number) => ({
        stepNumber: s.step_number || idx + 1,
        title: s.step_name,
        subtitle: s.responsible_party ? `Stage ${s.step_number || idx + 1} • ${s.responsible_party}` : `Stage ${s.step_number || idx + 1}`,
        timeline: '7-15 Working Days',
        description: s.description || 'Complete statutory milestones as per Bureau of Indian Standards procedures.',
        action: `File on e-BIS Manakonline Portal`,
        responsibleParty: s.responsible_party,
        feeType: s.fee_type,
        feeAmount: s.fee_amount,
        sourceUrl: s.source_url,
      }));

      if (applicationMilestones.length === 0) {
        applicationMilestones = [
          { stepNumber: 1, title: 'Portal Registration & Form-V Submission', subtitle: 'Step 1 • Manufacturer', timeline: '1-3 Days', description: 'Register factory profile on manakonline.in and submit statutory Form-V application.', action: 'Create e-BIS account' },
          { stepNumber: 2, title: 'Application Fee & Document Scrutiny', subtitle: 'Step 2 • BIS Officer', timeline: '5-7 Days', description: 'Remit ₹1,000 application fee. BIS scrutiny officer examines manufacturing premises details.', action: 'Pay application fee' },
          { stepNumber: 3, title: 'Factory Audit & Independent Sampling', subtitle: 'Step 3 • BIS Auditor', timeline: '15-20 Days', description: 'Statutory on-site inspection. Verification of routine testing apparatus and counter-sample sealing.', action: 'Coordinate factory inspection' },
          { stepNumber: 4, title: 'Recognized Laboratory Testing', subtitle: 'Step 4 • BIS / NABL Lab', timeline: '30-45 Days', description: 'Independent type testing of sealed sample in accordance with Indian Standard clauses.', action: 'Track LIMS test report' },
          { stepNumber: 5, title: 'Inspection Review & Marking Fee', subtitle: 'Step 5 • BIS Committee', timeline: '7-10 Days', description: 'Review of test conformity report and payment of minimum annual marking fee.', action: 'Remit marking fee' },
          { stepNumber: 6, title: 'Grant of BIS Licence (CM/L)', subtitle: 'Step 6 • Statutory Grant', timeline: '2-5 Days', description: 'Issuance of Certificate of Conformity and 7-digit CM/L licence number for ISI mark usage.', action: 'Download CM/L Certificate' },
        ];
      }

      const citations: Citation[] = [
        ...fileCitations,
        {
          document: resolved.standard.title,
          title: resolved.standard.title,
          document_title: resolved.standard.title,
          page: 1,
          page_number: 1,
          text: resolved.standard.scope,
          standard_id: resolved.standard.standard_number,
          url: resolved.standard.source_url || (resolved.standard.standard_number ? `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent(resolved.standard.standard_number.replace(/\s+/g, ''))}` : 'https://www.bis.gov.in'),
          source_url: resolved.standard.source_url || 'https://www.bis.gov.in',
        }
      ];

      const updatedProfile: ProductProfile = {
        name: resolved.product_profile.name,
        category: resolved.product_profile.category,
        industryScale: resolved.product_profile.industry_scale,
        isForeign: resolved.product_profile.is_foreign,
        manufacturingLocation: resolved.product_profile.manufacturing_location,
        subType: productProfile.subType,
        intendedUse: productProfile.intendedUse,
        keyMaterial: productProfile.keyMaterial,
        technicalSpecs: productProfile.technicalSpecs,
      };

      const guideResult: ProductCertificationGuideData = {
        query: trimmed,
        productProfile: updatedProfile,
        standardDetails: {
          code: resolved.standard.standard_number,
          title: resolved.standard.title,
          whyItApplies: resolved.standard.why_it_applies,
          scope: resolved.standard.scope,
          relatedStandards: resolved.standard.related_standards || [],
          officialSource: resolved.standard.official_source,
          officialUrl: resolved.standard.pdf_url || 'https://www.services.bis.gov.in',
          confidence: (resolved.standard.confidence as 'HIGH' | 'MEDIUM' | 'NEEDS_VERIFICATION') || undefined,
          // Step 2 validation fields from backend RAG check
          confirmed: resolved.standard.confirmed ?? true,
          reason: resolved.standard.reason || undefined,
          evidenceDocument: resolved.standard.evidence_document ?? null,
          evidencePage: resolved.standard.evidence_page ?? null,
        },
        certificationDetails: {
          isMandatory: resolved.certification.is_mandatory,
          applicability: resolved.certification.applicability,
          scheme: resolved.certification.scheme,
          qcoNotification: resolved.certification.qco ? `${resolved.certification.qco.name} (${resolved.certification.qco.notification_number || ''})` : 'No mandatory QCO notified yet for this standard.',
          qcoName: resolved.certification.qco?.name,
          notifyingAuthority: resolved.certification.qco?.authority,
          notificationDate: resolved.certification.qco?.notification_date,
          effectiveDate: resolved.certification.qco?.effective_date,
          complianceDeadline: resolved.certification.qco?.compliance_deadline,
          keyConditions: [
            'Compliance with benchmark Indian Standard specifications',
            'Installation of in-house testing facility for routine factory tests',
            'Maintenance of Scheme of Inspection and Testing (SIT) records'
          ],
          exemptions: [
            resolved.certification.msme_benefits?.concession_details || 'Standard statutory rates apply.'
          ],
          msmeBenefitDetails: resolved.certification.msme_benefits?.concession_details,
        },
        testingDetails: {
          requiredTests,
          routineTests,
          typeTests,
          laboratories: labs,
          groupingRules,
          labInfo: labs.length > 0 
            ? `${labs.length} BIS-recognized laboratory facilities available with verified statutory testing charges.`
            : 'BIS Central & Regional testing laboratories network.',
          samplingProtocol: 'Auditors draw 2 production samples during factory audit: 1 for independent testing at recognized lab, 1 counter-sample kept under seal.',
          regulatoryNoticeCount: testingData?.regulatory_notifications_count || 0,
          hasRegulatoryUpdates: Boolean(testingData?.has_regulatory_updates),
          unmappedWarning: testingData?.unmapped_regulatory_warning || null,
        },
        documentChecklist,
        applicationMilestones,
        rawMarkdownResponse: rawAiReply || `Product resolved to ${resolved.standard.standard_number}: ${resolved.standard.title}`,
        citations,
        timestamp: Date.now(),
        attachmentName: file?.name,
      };

      setProductProfile(updatedProfile);
      setGuideData(guideResult);
      setActiveStep(1);
    } catch (err: any) {
      if (err.name === 'AbortError' && !err.isTimeout) {
        return;
      }
      console.error('Failed to start product certification guide:', err);
      const isTimeout = err instanceof ApiTimeoutError || err.name === 'ApiTimeoutError' || err.isTimeout;
      const msg = isTimeout
        ? (t('common.aiTimeout') || 'AI response is taking longer than expected. Please try again.')
        : (t('common.apiUnavailable') || 'Unable to connect right now. Please try again.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      activeAbortControllerRef.current = null;
    }
  }, [sessionId, language, productProfile, isLoading, t]);

  const askContextualAI = useCallback(async (
    question: string, 
    file?: File,
    signal?: AbortSignal
  ): Promise<{ reply: string; citations: Citation[] }> => {
    const currentProductName = productProfile.name || guideData?.productProfile.name || 'Product';
    const contextObj = {
      page: 'product-guide',
      tab: 'product-guide',
      stage: activeStep,
      active_step: activeStep,
      product: currentProductName,
      product_name: currentProductName,
      standardId: guideData?.standardDetails?.code,
      standard_id: guideData?.standardDetails?.code,
      standardName: guideData?.standardDetails?.title,
      standard_name: guideData?.standardDetails?.title,
      industry_scale: productProfile.industryScale,
      sub_type: productProfile.subType,
      technical_specs: productProfile.technicalSpecs,
      location: productProfile.manufacturingLocation,
    };

    if (file) {
      const res = await sendMultimodalMessage(sessionId, question, file, language, signal);
      return {
        reply: res.reply,
        citations: res.citations || [],
      };
    } else {
      const res = await sendChatMessage(sessionId, question, language, contextObj, signal);
      return {
        reply: res.reply,
        citations: res.citations || [],
      };
    }
  }, [sessionId, language, productProfile, guideData, activeStep]);

  const resetJourney = useCallback(() => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }
    setGuideData(null);
    setProductProfile(defaultProfile);
    setActiveStep(1);
    setErrorMessage(null);
    lastQueryRef.current = null;
  }, []);

  const retryLastJourney = useCallback(async () => {
    if (lastQueryRef.current) {
      await startJourney(lastQueryRef.current.query, lastQueryRef.current.file);
    }
  }, [startJourney]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const fetchSavedGuides = useCallback(async () => {
    try {
      const backendGuides = await getUserSavedGuides();
      let localGuides: SavedProductGuideItem[] = [];
      try {
        const stored = localStorage.getItem('manaksetu_saved_guides');
        if (stored) localGuides = JSON.parse(stored);
      } catch (e) {
        console.warn('Error reading local saved guides:', e);
      }

      const map = new Map<string, SavedProductGuideItem>();
      backendGuides.forEach((g) => map.set(g.product_name.toLowerCase(), g));
      localGuides.forEach((g) => {
        if (!map.has(g.product_name.toLowerCase())) {
          map.set(g.product_name.toLowerCase(), g);
        }
      });
      setSavedGuides(Array.from(map.values()));
    } catch (err) {
      console.warn('Failed to fetch saved guides:', err);
    }
  }, []);

  // FIX: Aggressive account isolation enforcement. 
  // Wipes context completely if no user is authenticated, otherwise fetches specific data.
  useEffect(() => {
    if (!user) {
      setGuideData(null);
      setProductProfile(defaultProfile);
      setActiveStep(1);
      setErrorMessage(null);
      setSavedGuides([]);
      setSessionId(`product_session_${Date.now()}`);
    } else {
      fetchSavedGuides();
    }
  }, [user, fetchSavedGuides]);

  const saveJourney = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!guideData && !productProfile.name) {
      return { success: false, message: 'No product guide data to save.' };
    }

    const prodName = productProfile.name || guideData?.productProfile.name || 'Product';
    const stdCode = guideData?.standardDetails?.code || '';
    const currentQuery = guideData?.query || prodName;

    const itemToSave: SavedProductGuideItem = {
      id: `local_${Date.now()}`,
      product_name: prodName,
      standard_code: stdCode,
      active_step: activeStep,
      query: currentQuery,
      product_profile: productProfile,
      guide_data: guideData,
      updated_at: new Date().toISOString(),
    };

    let backendSaved = false;
    try {
      const res = await saveUserProductGuide({
        product_name: prodName,
        standard_code: stdCode,
        active_step: activeStep,
        query: currentQuery,
        product_profile: productProfile,
        guide_data: guideData,
      });
      if (res.success && res.id) {
        itemToSave.id = res.id;
        backendSaved = true;
      }
    } catch (apiErr) {
      console.info('Backend save skipped or unauthenticated, persisting locally:', apiErr);
    }

    try {
      const stored = localStorage.getItem('manaksetu_saved_guides');
      const list: SavedProductGuideItem[] = stored ? JSON.parse(stored) : [];
      const filtered = list.filter((g) => g.product_name.toLowerCase() !== prodName.toLowerCase());
      filtered.unshift(itemToSave);
      localStorage.setItem('manaksetu_saved_guides', JSON.stringify(filtered));
    } catch (lsErr) {
      console.warn('Local storage save error:', lsErr);
    }

    await fetchSavedGuides();
    return {
      success: true,
      message: backendSaved ? 'Progress saved to your account!' : 'Progress saved successfully!'
    };
  }, [guideData, productProfile, activeStep, fetchSavedGuides]);

  const loadSavedGuide = useCallback((saved: SavedProductGuideItem) => {
    if (saved.product_profile) {
      setProductProfile(saved.product_profile);
    }
    if (saved.guide_data) {
      setGuideData(saved.guide_data);
    }
    setActiveStep(saved.active_step || 1);
    setErrorMessage(null);
  }, []);

  const deleteSavedGuide = useCallback(async (guideId: string) => {
    try {
      await deleteUserSavedGuide(guideId);
    } catch (e) {
      // ignore
    }
    try {
      const stored = localStorage.getItem('manaksetu_saved_guides');
      if (stored) {
        const list: SavedProductGuideItem[] = JSON.parse(stored);
        const filtered = list.filter((g) => g.id !== guideId);
        localStorage.setItem('manaksetu_saved_guides', JSON.stringify(filtered));
      }
    } catch (e) {
      // ignore
    }
    await fetchSavedGuides();
  }, [fetchSavedGuides]);

  return (
    <ProductContext.Provider
      value={{
        productProfile,
        guideData,
        activeStep,
        isLoading,
        errorMessage,
        savedGuides,
        setActiveStep,
        updateProductProfile,
        startJourney,
        retryLastJourney,
        clearError,
        askContextualAI,
        resetJourney,
        saveJourney,
        loadSavedGuide,
        deleteSavedGuide,
        fetchSavedGuides,
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