import React, { useState } from 'react';
import { FlaskConical, ArrowRight, ArrowLeft, Building2, FileCheck, Layers, ExternalLink, ShieldCheck, MapPin, Gauge } from 'lucide-react';
import { TestingDetails } from '../../types/compliance';
import { useLanguage } from '../../context/LanguageContext';

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
  const [activeTab, setActiveTab] = useState<'routine' | 'type' | 'labs' | 'grouping'>('routine');

  const routineTests = testingDetails.routineTests || testingDetails.requiredTests?.filter(t => t.type === 'Routine Test') || [];
  const typeTests = testingDetails.typeTests || testingDetails.requiredTests?.filter(t => t.type !== 'Routine Test') || [];
  const labs = testingDetails.laboratories || [];
  const groupingRules = testingDetails.groupingRules || [];

  return (
    <div className="space-y-6 animate-fade-in">
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
          {labs.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold font-mono">
              {labs.length}
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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-900">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Authoritative BIS Recognized Testing Laboratories</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">Official LIMS Database</span>
          </div>

          {labs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {labs.map((lab) => (
                <div key={lab.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-indigo-300 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">{lab.labName}</h4>
                    {lab.oslCode && (
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 rounded shrink-0">
                        OSL: {lab.oslCode}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{lab.address}, {lab.city}, {lab.state}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    {lab.testingCharge ? (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">Statutory Charge: </span>
                        <span className="font-mono font-bold text-emerald-700">₹{lab.testingCharge.toLocaleString()} {lab.currency}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500">Tariff per sample lot</span>
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

