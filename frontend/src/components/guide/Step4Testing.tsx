import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FlaskConical, 
  ArrowRight, 
  ArrowLeft, 
  Building2, 
  FileCheck, 
  Layers, 
  ExternalLink, 
  ShieldCheck, 
  MapPin, 
  Gauge,
  Navigation,
  Search,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Filter,
  CheckCircle2,
  FileText,
  Info
} from 'lucide-react';
import { TestingDetails, LabItem, StandardDetails, TestItem, GroupingRuleItem } from '../../types/compliance';
import { PageInfoButton } from '../common/PageInfoButton';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';
import { getRecommendedLaboratories } from '../../services/api';

interface Step4TestingProps {
  productName: string;
  standardDetails?: StandardDetails;
  testingDetails: TestingDetails;
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step4Testing: React.FC<Step4TestingProps> = ({
  productName,
  standardDetails,
  testingDetails,
  onNext,
  onPrev,
  onAskAI,
}) => {
  const { t } = useLanguage();
  const { guideData, productProfile } = useProductContext();

  // Dynamic Product & Standard from props and context
  const effectiveProduct = productName || productProfile?.name || guideData?.productProfile?.name || 'Selected Product';
  const effectiveStandard = standardDetails || guideData?.standardDetails;
  const standardCode = effectiveStandard?.code && effectiveStandard.code !== 'Data Not Available' 
    ? effectiveStandard.code 
    : '';
  const standardTitle = effectiveStandard?.title || '';

  // Tab navigation: tests (default main focus), labs, grouping
  const [activeTab, setActiveTab] = useState<'tests' | 'labs' | 'grouping'>('tests');

  // Test table filtering and search
  const [testFilter, setTestFilter] = useState<'all' | 'routine' | 'type'>('all');
  const [testSearch, setTestSearch] = useState<string>('');

  // Track which laboratory contact info is currently expanded
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  // Location & Lab recommendation states
  const [userLocation, setUserLocation] = useState<string>(() => {
    return sessionStorage.getItem('bis_user_location') || '';
  });
  const [locationSkipped, setLocationSkipped] = useState<boolean>(() => {
    return sessionStorage.getItem('bis_location_skipped') === 'true';
  });
  const [showLocationModal, setShowLocationModal] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('bis_user_location');
    const skipped = sessionStorage.getItem('bis_location_skipped') === 'true';
    return !saved && !skipped;
  });

  const [inputLocation, setInputLocation] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isLoadingLabs, setIsLoadingLabs] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [recommendedLabs, setRecommendedLabs] = useState<any[] | null>(null);
  const [labsError, setLabsError] = useState<string | null>(null);
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>(() => {
    return sessionStorage.getItem('bis_user_location') || '';
  });

  // Extract routine and type tests
  const routineTests: TestItem[] = useMemo(() => {
    return testingDetails.routineTests || testingDetails.requiredTests?.filter(t => t.type === 'Routine Test') || [];
  }, [testingDetails]);

  const typeTests: TestItem[] = useMemo(() => {
    return testingDetails.typeTests || testingDetails.requiredTests?.filter(t => t.type !== 'Routine Test') || [];
  }, [testingDetails]);

  // Unified tests array belonging strictly to the selected standard
  const allTests: TestItem[] = useMemo(() => {
    if (testingDetails.requiredTests && testingDetails.requiredTests.length > 0) {
      return testingDetails.requiredTests;
    }
    return [...routineTests, ...typeTests];
  }, [testingDetails, routineTests, typeTests]);

  // Filtered tests based on active filter button and search query
  const filteredTests = useMemo(() => {
    let result = allTests;
    if (testFilter === 'routine') {
      result = result.filter(t => t.type === 'Routine Test');
    } else if (testFilter === 'type') {
      result = result.filter(t => t.type !== 'Routine Test');
    }

    if (testSearch.trim()) {
      const q = testSearch.toLowerCase().trim();
      result = result.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) ||
        (t.clause && t.clause.toLowerCase().includes(q)) ||
        (t.testMethod && t.testMethod.toLowerCase().includes(q)) ||
        (t.frequency && t.frequency.toLowerCase().includes(q)) ||
        (t.sampleQuantity && t.sampleQuantity.toLowerCase().includes(q))
      );
    }
    return result;
  }, [allTests, testFilter, testSearch]);

  const rawGrouping = testingDetails.groupingRules || [];

  // Normalize grouping rules to handle both snake_case and camelCase
  const groupingRules = useMemo(() => {
    return rawGrouping.map((gr: any) => ({
      groupCode: gr.groupCode || gr.group_code || 'RULE',
      groupName: gr.groupName || gr.group_name || 'Grouping Rule',
      condition: gr.condition || '',
      sampleRequirement: (gr.sampleRequirement || gr.sample_requirement || '').trim(),
      preferredSample: (gr.preferredSample || gr.preferred_sample || '').trim(),
      voltageRequirement: (gr.voltageRequirement || gr.voltage_requirement || '').trim(),
      remarks: (gr.remarks || '').trim(),
      sourcePage: gr.sourcePage || gr.source_page || null,
    }));
  }, [rawGrouping]);

  // Fetch recommended laboratories using EXISTING GET /api/labs/recommend
  const fetchRecommendations = useCallback(async (loc?: string, lat?: number, lng?: number) => {
    setIsLoadingLabs(true);
    setLabsError(null);
    try {
      const res = await getRecommendedLaboratories({
        location: loc,
        lat,
        lng,
        standard_id: standardCode || undefined,
      });
      if (res && res.laboratories) {
        setRecommendedLabs(res.laboratories);
        const effectiveLoc = res.detected_city || loc || (res.detected_state ? `${res.detected_state}` : '');
        if (effectiveLoc) {
          setActiveLocationLabel(effectiveLoc);
          setUserLocation(effectiveLoc);
          sessionStorage.setItem('bis_user_location', effectiveLoc);
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch laboratory recommendations:', err);
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout;
      setLabsError(
        isTimeout
          ? (t('common.aiTimeout') || 'Laboratory search took longer than expected. Please retry.')
          : (t('common.apiUnavailable') || 'Failed to load authorized laboratory listings. Please try again.')
      );
    } finally {
      setIsLoadingLabs(false);
    }
  }, [standardCode, t]);

  useEffect(() => {
    if (userLocation) {
      fetchRecommendations(userLocation);
    } else {
      fetchRecommendations();
    }
  }, [userLocation, fetchRecommendations]);

  const handleUseDeviceLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please type your city or state.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        setShowLocationModal(false);
        sessionStorage.removeItem('bis_location_skipped');
        setLocationSkipped(false);
        setActiveTab('labs');
        await fetchRecommendations(undefined, latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission was denied. You can manually enter your city or state below.');
        } else {
          setGeoError('Unable to detect GPS coordinates. Please enter your city or state manually.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleManualLocationSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const loc = inputLocation.trim();
    if (!loc) return;
    setGeoError(null);
    setShowLocationModal(false);
    sessionStorage.removeItem('bis_location_skipped');
    setLocationSkipped(false);
    setUserLocation(loc);
    setActiveLocationLabel(loc);
    sessionStorage.setItem('bis_user_location', loc);
    setActiveTab('labs');
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    setLocationSkipped(true);
    sessionStorage.setItem('bis_location_skipped', 'true');
    if (!recommendedLabs) {
      fetchRecommendations();
    }
  };

  // Strictly display laboratories returned from backend API (no hardcoded/fallback fake records)
  const displayedLabs = useMemo(() => {
    if (!recommendedLabs) return [];
    return recommendedLabs.map((rl: any) => ({
      id: rl.id,
      labName: rl.lab_name,
      oslCode: rl.osl_code || null,
      address: rl.address || null,
      city: rl.city || null,
      state: rl.state || null,
      status: rl.status || null,
      testingCharge: rl.testing_charge != null ? rl.testing_charge : null,
      testingScopes: Array.isArray(rl.testing_scopes) ? rl.testing_scopes : [],
      currency: rl.currency || null,
      sourceUrl: rl.source_url || null,
      remarks: rl.remarks || null,
      proximityTier: rl.proximity_tier || null,
      email: rl.contact_email || null,
      phone: rl.contact_phone || null,
      website: rl.website || null,
      lat: rl.latitude != null ? rl.latitude : null,
      lng: rl.longitude != null ? rl.longitude : null,
    }));
  }, [recommendedLabs]);

  const getProximityBadgeStyle = (tier: string) => {
    const tLower = tier.toLowerCase();
    if (tLower.includes('same city')) return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
    if (tLower.includes('ncr')) return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
    if (tLower.includes('state') || tLower.includes('regional')) return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
    return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
  };

 const getMapsUrl = (lab: any) => {
  // 1. Gather all the text details (Name, Address, City, etc.)
  const queryParts = [lab.labName, lab.address, lab.city, lab.state, lab.pincode].filter(Boolean);
  const textQuery = queryParts.join(', ');

  if (lab.lat && lab.lng) {
    // 2. Combine Coordinates WITH the text query for maximum accuracy!
    const combinedQuery = `${lab.lat},${lab.lng} ${textQuery}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(combinedQuery)}`;
  }
  
  // 3. Fallback just in case a lab is missing coordinates in your database
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textQuery)}`;
};

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative">
            <button
              onClick={handleSkipLocation}
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Skip for now"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-700">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="pr-6">
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-800 rounded">
                  Laboratory Proximity Finder
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                  Find Nearest BIS Testing Laboratories
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Enter your manufacturing city or allow GPS detection to find BIS-recognized laboratories near your facility.
                </p>
              </div>
            </div>

            {geoError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{geoError}</span>
              </div>
            )}

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                disabled={isLocating}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Detecting GPS Coordinates...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Use My Current Device Location</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold uppercase text-slate-400 absolute">
                  Or enter manually
                </span>
              </div>

              <form onSubmit={handleManualLocationSubmit} className="flex gap-2 pt-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={inputLocation}
                    onChange={(e) => setInputLocation(e.target.value)}
                    placeholder="e.g. Noida, Delhi, Bahadurgarh, Mumbai..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputLocation.trim()}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shrink-0 transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleSkipLocation}
                className="text-slate-500 hover:text-slate-800 font-semibold hover:underline cursor-pointer"
              >
                Skip for now (View all labs)
              </button>
              <span className="text-[11px] text-slate-400">
                You can change location anytime
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
            Stage 4 of 6
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            Step 4: Testing & Laboratories
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Find the tests required for your product and suitable BIS-recognized laboratories.
          </p>
        </div>
        <PageInfoButton
          sectionId="section-testing-labs"
          tooltip="Learn about In-House SIT & Laboratory Testing in the Guide"
          variant="light"
          size="sm"
        />
      </div>

      {/* Dynamic Product & Applicable Standard Metadata Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Product:
            </span>
            <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-900 font-bold border border-slate-200">
              {effectiveProduct}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Applicable Standard:
            </span>
            <span className="px-3 py-1 rounded-lg bg-bis-900 text-white font-mono font-bold shadow-2xs">
              {standardCode || 'Standard Identified'}
            </span>
            {standardTitle && (
              <span className="text-xs text-slate-600 font-medium hidden md:inline truncate max-w-lg" title={standardTitle}>
                — {standardTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tests'
              ? 'bg-white text-bis-950 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
          <span>Required Tests</span>
          {allTests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              {allTests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'labs'
              ? 'bg-white text-bis-950 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Recognized Laboratories</span>
          {displayedLabs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
              {displayedLabs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('grouping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'grouping'
              ? 'bg-white text-bis-950 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-amber-600" />
          <span>Grouping & Sampling Rules</span>
          {groupingRules.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono">
              {groupingRules.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: REQUIRED TESTS (Clean Table as Main Focus)             */}
      {/* ============================================================ */}
      {activeTab === 'tests' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
          {/* Header & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span>Mandatory Scheme-I & Laboratory Test Parameters</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Clause-wise technical tests, methods, and verification frequencies under <strong>{standardCode || 'selected standard'}</strong>.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setTestFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  testFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({allTests.length})
              </button>
              <button
                type="button"
                onClick={() => setTestFilter('routine')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  testFilter === 'routine'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Routine ({routineTests.length})
              </button>
              <button
                type="button"
                onClick={() => setTestFilter('type')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  testFilter === 'type'
                    ? 'bg-indigo-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                Type & Acceptance ({typeTests.length})
              </button>
            </div>
          </div>

          {/* Verified Regulatory Notifications Banner (if standard has test change notices) */}
          {testingDetails.hasRegulatoryUpdates && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-extrabold text-amber-950 flex items-center gap-2">
                  <span>Verified BIS Regulatory Test Updates Active</span>
                  {testingDetails.regulatoryNoticeCount && testingDetails.regulatoryNoticeCount > 0 && (
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900">
                      {testingDetails.regulatoryNoticeCount} {testingDetails.regulatoryNoticeCount === 1 ? 'Notice' : 'Notices'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Test requirements for this standard have been verified against official BIS regulatory gazette orders. Look for the <span className="font-bold text-amber-950">New BIS Requirement</span> badges in the test schedule below.
                </p>
              </div>
            </div>
          )}

          {/* Unmapped Regulatory Notice Warning (Requirement 9) */}
          {testingDetails.unmappedWarning && (
            <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-950 flex items-start gap-2 shadow-2xs">
              <Info className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                {testingDetails.unmappedWarning}
              </div>
            </div>
          )}

          {/* Search Bar for Tests */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              placeholder="Search tests by clause, requirement name, or testing method..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bis-500 focus:border-bis-500"
            />
            {testSearch && (
              <button
                onClick={() => setTestSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Clean Table: Clause | Test / Requirement | Type | Method | Frequency / Sample */}
          {filteredTests.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 w-28 whitespace-nowrap">
                      Clause
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[220px]">
                      Test / Requirement
                    </th>
                    <th scope="col" className="px-4 py-3.5 w-36 whitespace-nowrap">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[160px]">
                      Method
                    </th>
                    <th scope="col" className="px-4 py-3.5 min-w-[160px]">
                      Frequency / Sample
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {filteredTests.map((test, idx) => {
                    const isRoutine = test.type === 'Routine Test';
                    const isAcceptance = test.type === 'Acceptance Test';

                    // Format frequency / sample cleanly
                    let freqSample = '—';
                    if (test.frequency && test.sampleQuantity) {
                      freqSample = test.frequency === test.sampleQuantity 
                        ? test.frequency 
                        : `${test.frequency} (Qty: ${test.sampleQuantity})`;
                    } else if (test.frequency) {
                      freqSample = test.frequency;
                    } else if (test.sampleQuantity) {
                      freqSample = test.sampleQuantity;
                    }

                    return (
                      <tr 
                        key={idx} 
                        className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/30"
                      >
                        {/* Clause Column */}
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap align-top">
                          {test.clause ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] border border-slate-200">
                              {test.clause.startsWith('Cl') || test.clause.startsWith('Clause') 
                                ? test.clause 
                                : `Cl. ${test.clause}`}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Test / Requirement Column */}
                        <td className="px-4 py-3.5 align-top">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              {test.name}
                            </span>
                            {test.isUpdated && (
                              <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                                title={test.regulatoryUpdate?.message || 'Verified under official BIS regulatory notification'}
                              >
                                <Sparkles className="w-3 h-3 text-amber-600" />
                                <span>{test.regulatoryUpdate?.badge || 'New BIS Requirement'}</span>
                              </span>
                            )}
                          </div>
                          {test.isUpdated && (
                            <div className="mt-1 text-[10px] font-medium text-amber-900 flex items-center gap-1 flex-wrap">
                              <span className="font-bold">Source:</span>
                              <span>{test.regulatorySource || 'Official BIS regulatory evidence'}</span>
                              {test.regulatoryUpdate?.createdAt && (
                                <span className="text-slate-400 font-mono">
                                  • {new Date(test.regulatoryUpdate.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          )}
                          {test.remarks && test.remarks !== test.name && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              {test.remarks}
                            </p>
                          )}
                          {test.sourcePage && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-bis-700">
                              <FileText className="w-3 h-3" />
                              <span>Manual Page {test.sourcePage}</span>
                            </div>
                          )}
                        </td>

                        {/* Type Column */}
                        <td className="px-4 py-3.5 align-top whitespace-nowrap">
                          {isRoutine ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Routine
                            </span>
                          ) : isAcceptance ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              Acceptance
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              Type Test
                            </span>
                          )}
                        </td>

                        {/* Method Column */}
                        <td className="px-4 py-3.5 align-top">
                          {test.testMethod ? (
                            <span className="text-xs font-mono text-slate-700">
                              {test.testMethod}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Frequency / Sample Column */}
                        <td className="px-4 py-3.5 align-top">
                          <span className="text-xs text-slate-800">
                            {freqSample}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <FlaskConical className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                {testSearch 
                  ? 'No tests matched your search term.' 
                  : 'No specific test records were found in the available BIS evidence for this standard.'}
              </p>
              {testSearch && (
                <button
                  type="button"
                  onClick={() => setTestSearch('')}
                  className="text-xs font-bold text-bis-700 hover:underline cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Informational Note & BIS Helpline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-bis-50/70 border border-bis-200/80 text-bis-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-bis-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                <span className="font-bold text-bis-900">Note:</span> Some clauses or testing requirements may not be applicable depending on the product construction, configuration, or specifications. For more specific information, ask Manak Setu AI or contact BIS consultant/specialist.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-center pl-8 md:pl-0 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-bis-200/90 md:pl-5">
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block leading-tight">
                  BIS Product Certification Helpline
                </span>
                <span className="text-xs font-semibold text-bis-900 block mt-0.5">
                  BIS consultant/specialist.
                </span>
              </div>
              <a
                href="tel:7669089326"
                aria-label="Call BIS Product Certification Helpline at 7669089326"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-bis-900 hover:bg-bis-800 active:bg-bis-950 text-white text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>7669089326</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: RECOGNIZED LABORATORIES                               */}
      {/* ============================================================ */}
      {activeTab === 'labs' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Authoritative BIS Recognized Testing Laboratories</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Official LIMS Database</span>
          </div>

          {/* Location Reference Status & Change Location Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                  Proximity Reference
                </span>
                <div className="text-slate-800 font-medium">
                  {activeLocationLabel ? (
                    <span>Facility / District: <strong className="text-indigo-700 font-bold">{activeLocationLabel}</strong></span>
                  ) : (
                    <span className="text-slate-600 font-semibold">Showing all national BIS recognized laboratories</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setInputLocation(activeLocationLabel || '');
                setShowLocationModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{activeLocationLabel ? 'Change Location' : 'Set Location for Nearest Labs'}</span>
            </button>
          </div>

          {isLoadingLabs ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-2 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-700">Loading authorized laboratories from BIS LIMS...</p>
            </div>
          ) : labsError ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-xs sm:text-sm font-semibold">{labsError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchRecommendations(activeLocationLabel || userLocation || undefined)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs self-start sm:self-center"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('common.retry') || 'Retry'}</span>
              </button>
            </div>
          ) : displayedLabs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedLabs.map((lab) => {
                const hasContactInfo = !!(lab.email || lab.phone || lab.website);
                const isContactOpen = expandedContactId === lab.id;
                const locationParts = [lab.address, lab.city, lab.state].filter(Boolean);
                const locationText = locationParts.join(', ');

                return (
                  <div 
                    key={lab.id} 
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-indigo-300 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        {lab.proximityTier ? (
                          <span className={`px-2 py-0.5 text-[10px] rounded-md border ${getProximityBadgeStyle(lab.proximityTier)}`}>
                            {lab.proximityTier}
                          </span>
                        ) : <div />}
                        <div className="flex items-center gap-1">
                          {lab.status && (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{lab.status}</span>
                            </span>
                          )}
                          {lab.oslCode && (
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 rounded shrink-0">
                              OSL: {lab.oslCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {lab.labName && (
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {lab.labName}
                        </h4>
                      )}

                      {locationText && (
                        <div className="text-xs text-slate-600 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">
                            {locationText}
                          </span>
                        </div>
                      )}

                      {lab.testingScopes && lab.testingScopes.length > 0 ? (
                        <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5">
                          <span className="font-semibold text-slate-700 block">
                            Charges:
                          </span>
                          {lab.testingScopes.map((scope: any, scopeIdx: number) => {
                            const scopeLabel = scope.grade_type_size || (scope.remarks ? scope.remarks : null);
                            return (
                              <div key={scopeIdx} className="flex items-center justify-between gap-3">
                                {scopeLabel && (
                                  <span className="text-slate-700">{scopeLabel}</span>
                                )}
                                {scope.testing_charge != null && (
                                  <span className="font-mono font-bold text-emerald-700 shrink-0">
                                    ₹{scope.testing_charge.toLocaleString()} {scope.currency || lab.currency || ''}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : lab.remarks ? (
                        <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/70">
                          <span className="font-semibold text-slate-700">Testing Scope: </span>
                          <span>{lab.remarks}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Contact & Map Action Bar */}
                    <div className="flex flex-col gap-2 pt-2.5 border-t border-slate-200/70">
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
                        {lab.testingCharge != null ? (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500">Statutory Charge: </span>
                            <span className="font-mono font-bold text-emerald-700">₹{lab.testingCharge.toLocaleString()} {lab.currency || ''}</span>
                          </div>
                        ) : (
                          <div />
                        )}
                        {lab.sourceUrl && (
                          <a 
                            href={lab.sourceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900"
                          >
                            <span>Verify in LIMS</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full mt-1">
                        {locationText ? (
                          <a
                            href={getMapsUrl(lab)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 text-xs font-bold transition-colors border border-emerald-200 shadow-2xs"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>View on Map</span>
                          </a>
                        ) : null}

                        {hasContactInfo && (
                          <button
                            type="button"
                            onClick={() => setExpandedContactId(isContactOpen ? null : lab.id)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-2xs cursor-pointer ${
                              isContactOpen ? "bg-slate-800 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
                            }`}
                          >
                            <span>Contact Lab</span>
                            {isContactOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>

                      {isContactOpen && hasContactInfo && (
                        <div className="mt-1.5 p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-fade-in shadow-sm">
                          {lab.phone && (
                            <a href={`tel:${lab.phone}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{lab.phone}</span>
                            </a>
                          )}
                          {lab.email && (
                            <a href={`mailto:${lab.email}`} className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{lab.email}</span>
                            </a>
                          )}
                          {lab.website && (
                            <a href={lab.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors sm:col-span-2">
                              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{lab.website}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs sm:text-sm font-bold text-slate-700">
                No BIS laboratory matching the selected criteria was found in the available database.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: GROUPING & SAMPLING RULES                             */}
      {/* ============================================================ */}
      {activeTab === 'grouping' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Gauge className="w-4 h-4 text-amber-600" />
              <span>BIS Grouping Guidelines & Sample Representation</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Testing Optimization Rules</span>
          </div>

          {groupingRules.length > 0 ? (
            <div className="space-y-3">
              {groupingRules.map((gr, idx) => {
                // Strictly guard: do not show empty "Sample Requirement:" fields
                const hasSampleReq = Boolean(gr.sampleRequirement && gr.sampleRequirement.toLowerCase() !== 'none');
                const hasPrefSample = Boolean(gr.preferredSample && gr.preferredSample.toLowerCase() !== 'none');

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-mono text-[10px] font-bold">
                          {gr.groupCode}
                        </span>
                        <span>{gr.groupName}</span>
                      </h4>
                      {gr.sourcePage && (
                        <span className="text-[10px] font-bold text-amber-800">
                          Manual Page {gr.sourcePage}
                        </span>
                      )}
                    </div>

                    {gr.condition && (
                      <p className="text-xs text-amber-900 leading-relaxed">
                        <strong>Condition: </strong>{gr.condition}
                      </p>
                    )}

                    {(hasSampleReq || hasPrefSample) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs text-amber-900">
                        {hasSampleReq && (
                          <div>
                            <span className="font-semibold text-amber-800">Sample Requirement: </span>
                            <span>{gr.sampleRequirement}</span>
                          </div>
                        )}
                        {hasPrefSample && (
                          <div>
                            <span className="font-semibold text-amber-800">Preferred Variety: </span>
                            <span>{gr.preferredSample}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {gr.remarks && (
                      <p className="text-[11px] text-amber-800/80 pt-1">
                        <strong>Remarks: </strong>{gr.remarks}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">
                No specific grouping or sampling rules were found in the available BIS evidence.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Laboratory Facility & Sampling Protocol Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
            <Building2 className="w-4 h-4 text-bis-700" />
            <span>{t('s4LabInfo') || 'Statutory Test Facilities'}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {testingDetails.labInfo || 'BIS central laboratories, regional labs, and NABL-accredited BIS-recognized private facilities conduct statutory tests.'}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
            <FileCheck className="w-4 h-4 text-amber-600" />
            <span>Factory Audit Sampling Protocol</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {testingDetails.samplingProtocol || 'Auditors draw 2 production samples during the factory inspection: 1 for independent testing at recognized lab, 1 counter-sample kept under seal.'}
          </p>
        </div>
      </div>

      {/* Ask AI Contextual Question Helper */}
      {onAskAI && (
        <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-slate-600">
            Have questions about routine test parameters, STI frequencies, or recognized labs?
          </p>
          <button
            type="button"
            onClick={() =>
              onAskAI(
                effectiveProduct
                  ? `What are the testing requirements, routine tests, and recognized labs for ${effectiveProduct}?`
                  : 'What are the routine tests, acceptance tests, and laboratory requirements for BIS certification?'
              )
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-bis-900 hover:text-bis-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Ask Manak Setu AI about Testing & Labs</span>
          </button>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('prevStepBtn') || 'Previous Step'}</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95 cursor-pointer"
        >
          <span>{t('s4ContinueBtn') || 'Continue to Documents'}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};