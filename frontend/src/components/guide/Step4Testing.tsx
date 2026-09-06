import React, { useState, useEffect, useCallback } from 'react';
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
  Check
} from 'lucide-react';
import { TestingDetails, LabItem } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';
import { useProductContext } from '../../context/ProductContext';
import { getRecommendedLaboratories, RecommendedLab } from '../../services/api';

interface Step4TestingProps {
  productName: string;
  testingDetails: TestingDetails;
  onNext: () => void;
  onPrev: () => void;
  onAskAI?: (question: string) => Promise<{ reply: string; citations: any[] }>;
}

export const Step4Testing: React.FC<Step4TestingProps> = ({
  productName,
  testingDetails,
  onNext,
  onPrev,
}) => {
  const { t } = useLanguage();
  const { guideData } = useProductContext();
  const [activeTab, setActiveTab] = useState<'routine' | 'type' | 'labs' | 'grouping'>('routine');

  // Location & Lab recommendation states (Issue 6 & Issue 7)
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
  const [recommendedLabs, setRecommendedLabs] = useState<RecommendedLab[] | null>(null);
  const [activeLocationLabel, setActiveLocationLabel] = useState<string>(() => {
    return sessionStorage.getItem('bis_user_location') || '';
  });

  const routineTests = testingDetails.routineTests || testingDetails.requiredTests?.filter(t => t.type === 'Routine Test') || [];
  const typeTests = testingDetails.typeTests || testingDetails.requiredTests?.filter(t => t.type !== 'Routine Test') || [];
  const baseLabs = testingDetails.laboratories || [];
  const groupingRules = testingDetails.groupingRules || [];

  const standardCode = guideData?.standardDetails?.code || '';

  // Fetch recommended laboratories from existing backend database
  const fetchRecommendations = useCallback(async (loc?: string, lat?: number, lng?: number) => {
    setIsLoadingLabs(true);
    try {
      const res = await getRecommendedLaboratories({
        location: loc,
        lat,
        lng,
        standard_id: standardCode || '368',
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
    } catch (err) {
      console.warn('Failed to fetch laboratory recommendations:', err);
    } finally {
      setIsLoadingLabs(false);
    }
  }, [standardCode]);

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

  // Convert recommendedLabs or fallback to baseLabs
  const displayedLabs = (recommendedLabs && recommendedLabs.length > 0)
    ? recommendedLabs.map(rl => ({
        id: rl.id,
        labName: rl.lab_name,
        oslCode: rl.osl_code,
        address: rl.address,
        city: rl.city,
        state: rl.state,
        status: rl.status || 'Recognized (Valid)',
        testingCharge: rl.testing_charge,
        testingScopes: rl.testing_scopes,
        currency: rl.currency || 'INR',
        sourceUrl: rl.source_url,
        remarks: rl.remarks,
        proximityTier: rl.proximity_tier || 'National BIS Network',
      }))
    : baseLabs.map(l => ({
        ...l,
        status: 'Recognized (Valid)',
        testingScopes: undefined,
        proximityTier: 'National BIS Network',
      }));

  const getProximityBadgeStyle = (tier: string) => {
    const tLower = tier.toLowerCase();
    if (tLower.includes('same city')) {
      return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
    }
    if (tLower.includes('ncr')) {
      return 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
    }
    if (tLower.includes('state') || tLower.includes('regional')) {
      return 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 font-semibold';
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Location Prompt Modal (Issue 6 & Issue 7) */}
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
              </div>
            </div>

            {/* Explanation of WHY location is requested */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 leading-relaxed space-y-1">
              <p className="font-bold text-slate-800">
                Why is location requested?
              </p>
              <p>
                During Stage 4, sample lots must be sent to accredited laboratories. Providing your facility or district location allows Manak Setu to rank authorized laboratories by regional proximity from the official BIS directory.
              </p>
            </div>

            {geoError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>{geoError}</span>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                disabled={isLocating}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Detecting Device Location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Use Current Device Location</span>
                  </>
                )}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or enter manually</span>
                <div className="grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleManualLocationSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shrink-0 transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleSkipLocation}
                className="text-slate-500 hover:text-slate-800 font-semibold hover:underline"
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

      {/* Header */}
      <div className="space-y-1">
        <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase bg-bis-100 text-bis-900 rounded">
          Stage 4 of 6
        </span>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          {t('s4Title')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {t('s4Subtitle')}
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('routine')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'routine'
              ? 'bg-white text-bis-950 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
          <span>Routine Tests</span>
          {routineTests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
              {routineTests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('type')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'type'
              ? 'bg-white text-bis-950 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-bis-700" />
          <span>Type & Acceptance Tests</span>
          {typeTests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-bis-100 text-bis-800 text-[10px] font-bold font-mono">
              {typeTests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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

      {/* Tab Content 1: Routine Tests */}
      {activeTab === 'routine' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <FlaskConical className="w-4 h-4 text-emerald-600" />
              <span>Routine Factory Production Tests (Scheme-I Mandatory)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">100% In-house Factory Verification</span>
          </div>

          {routineTests.length > 0 ? (
            <div className="space-y-3">
              {routineTests.map((test, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-300 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{test.name}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {test.clause && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-slate-200 text-slate-800 rounded">
                          Clause {test.clause}
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-emerald-100 text-emerald-900">
                        Routine Test
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-7">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-7 pt-2 border-t border-slate-200/60 text-[11px]">
                    {test.testMethod && (
                      <div>
                        <span className="font-semibold text-slate-500">Method: </span>
                        <span className="text-slate-800 font-mono">{test.testMethod}</span>
                      </div>
                    )}
                    {test.frequency && (
                      <div>
                        <span className="font-semibold text-slate-500">Frequency: </span>
                        <span className="text-slate-800 font-bold">{test.frequency}</span>
                      </div>
                    )}
                    {test.sourcePage && (
                      <div>
                        <span className="font-semibold text-slate-500">Manual Citation: </span>
                        <span className="text-bis-800 font-bold">Page {test.sourcePage}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">No routine tests recorded for this standard.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Type Tests */}
      {activeTab === 'type' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Layers className="w-4 h-4 text-bis-800" />
              <span>Type & Acceptance Tests (Initial Qualification & Surveillance)</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Laboratory Verification</span>
          </div>

          {typeTests.length > 0 ? (
            <div className="space-y-3">
              {typeTests.map((test, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-bis-300 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-bis-900 text-white text-[10px] font-extrabold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{test.name}</span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {test.clause && (
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-slate-200 text-slate-800 rounded">
                          Clause {test.clause}
                        </span>
                      )}
                      <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded bg-bis-100 text-bis-900">
                        {test.type || 'Type Test'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-7">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-7 pt-2 border-t border-slate-200/60 text-[11px]">
                    {test.testMethod && (
                      <div>
                        <span className="font-semibold text-slate-500">Method: </span>
                        <span className="text-slate-800 font-mono">{test.testMethod}</span>
                      </div>
                    )}
                    {test.sampleQuantity && (
                      <div>
                        <span className="font-semibold text-slate-500">Sample Qty: </span>
                        <span className="text-slate-800">{test.sampleQuantity}</span>
                      </div>
                    )}
                    {test.sourcePage && (
                      <div>
                        <span className="font-semibold text-slate-500">Manual Citation: </span>
                        <span className="text-bis-800 font-bold">Page {test.sourcePage}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">No type tests recorded for this standard.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Recognized Laboratories */}
      {activeTab === 'labs' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Authoritative BIS Recognized Testing Laboratories</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Official LIMS Database</span>
          </div>

          {/* Location Reference Status & Change Location Button (Issue 6 & Issue 7) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Proximity Reference</span>
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
              className="px-3.5 py-1.5 rounded-xl border border-indigo-200 hover:border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
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
          ) : displayedLabs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedLabs.map((lab) => (
                <div key={lab.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-indigo-300 transition-colors flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-1.5">
                      <span className={`px-2 py-0.5 text-[10px] rounded-md border ${getProximityBadgeStyle(lab.proximityTier)}`}>
                        {lab.proximityTier}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>{lab.status}</span>
                        </span>
                        {lab.oslCode && (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 rounded shrink-0">
                            OSL: {lab.oslCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {lab.labName}
                    </h4>

                    <div className="text-xs text-slate-600 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{lab.address}, {lab.city}, {lab.state}</span>
                    </div>

                    {lab.testingScopes && lab.testingScopes.length > 0 ? (
                      <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70 space-y-1.5">
                        <span className="font-semibold text-slate-700 block">
                          Testing Scopes & Charges:
                        </span>

                        {lab.testingScopes.map((scope, scopeIdx) => (
                          <div
                            key={`${scope.grade_type_size || "scope"}-${scope.testing_charge ?? "na"}-${scopeIdx}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-slate-700">
                              {scope.grade_type_size || "Standard testing scope"}
                            </span>

                            {scope.testing_charge != null && (
                              <span className="font-mono font-bold text-emerald-700 shrink-0">
                                ₹{scope.testing_charge.toLocaleString()}{" "}
                                {scope.currency || lab.currency}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : lab.remarks ? (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/70">
                        <span className="font-semibold text-slate-700">
                          Testing Scope:{" "}
                        </span>
                        <span>{lab.remarks}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-xs">
                    {lab.testingCharge ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Statutory Charge: </span>
                        <span className="font-mono font-bold text-emerald-700">₹{lab.testingCharge.toLocaleString()} {lab.currency}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500">Statutory sample tariff</span>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">No specific laboratory listings recorded for this standard.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 4: Grouping & Sampling Rules */}
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
              {groupingRules.map((gr, idx) => (
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

                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Condition: </strong>{gr.condition}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs text-amber-900">
                    <div>
                      <span className="font-semibold text-amber-800">Sample Requirement: </span>
                      <span>{gr.sampleRequirement}</span>
                    </div>
                    {gr.preferredSample && (
                      <div>
                        <span className="font-semibold text-amber-800">Preferred Variety: </span>
                        <span>{gr.preferredSample}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-700">No grouping rules defined. Every distinct model requires separate test sample submission.</p>
            </div>
          )}
        </div>
      )}

      {/* Laboratory Facility & Sampling Protocol Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
            <Building2 className="w-4 h-4 text-bis-700" />
            <span>{t('s4LabInfo')}</span>
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

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('prevStepBtn')}</span>
        </button>

        <button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all transform active:scale-95"
        >
          <span>{t('s4ContinueBtn')}</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};

