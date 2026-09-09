import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ShieldCheck,
  FlaskConical,
  Building2,
  Gem,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Search,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Scale,
  FileCheck,
  Smartphone,
  Layers,
  Compass,
  Calculator,
  ChevronRight,
  AlertCircle,
  Cpu,
  Award,
  Factory,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const TOPIC_METADATA: Record<string, { category: string; keywords: string[] }> = {
  'section-bis': {
    category: 'statutory',
    keywords: ['bis', 'bureau', 'indian standards', 'act 2016', 'statutory', 'apex', 'standards formulation', 'certification', 'hallmarking', 'surveillance']
  },
  'section-applicable-standard': {
    category: 'statutory',
    keywords: ['standards', 'applicable standard', 'is code', 'specification', 'is 302', 'is 10500', 'is 1489', 'is 1293', 'division', 'technical committee']
  },
  'section-certification-schemes': {
    category: 'statutory',
    keywords: ['certification', 'schemes', 'scheme-i', 'isi mark', 'scheme-ii', 'crs', 'fmcs', 'cml', 'conformity', 'voluntary', 'mandatory']
  },
  'section-certification-qco': {
    category: 'statutory',
    keywords: ['qco', 'quality control order', 'mandatory', 'notification', 'section 16', 'statutory mandate', 'dpiit', 'gazette', 'penalties']
  },
  'section-testing-labs': {
    category: 'technical',
    keywords: ['testing', 'laboratories', 'lims', 'routine tests', 'type tests', 'nabl', 'sampling', 'central laboratory', 'osl', 'testing charges']
  },
  'section-documents': {
    category: 'technical',
    keywords: ['documents', 'checklist', 'form-v', 'factory layout', 'machinery', 'sit', 'msme', 'udyam', 'calibration', 'test records']
  },
  'section-application': {
    category: 'statutory',
    keywords: ['application', 'manakonline', 'ebis', 'portal', 'submission', 'scrutiny', 'audit', 'licence grant', 'cml certificate', 'marking fee']
  },
  'section-hallmarking': {
    category: 'consumer',
    keywords: ['hallmarking', 'huid', 'gold', 'silver', 'is 1417', 'is 2112', 'jewellery', 'assaying', 'ahc', 'carat', 'fineness', 'rule 49', 'compensation']
  },
  'section-consumer-verification': {
    category: 'consumer',
    keywords: ['consumer', 'verification', 'cml verification', 'bis care', 'grievance', 'complaint', 'compensation', 'misuse', 'fake mark', 'app']
  },
  'section-how-manak-setu-works': {
    category: 'architecture',
    keywords: ['manak setu', 'rag', 'hybrid rag', 'retrieval', 'supabase', 'pgvector', 'gemini', 'citations', 'architecture', 'zero hallucination']
  },
  'section-product-guide-flow': {
    category: 'architecture',
    keywords: ['product guide', 'consultation roadmap', '6 stages', 'product profile', 'applicable standard', 'fee estimator']
  },
};

interface InfoGuideViewProps {
  onOpenAssistant: (prompt?: string) => void;
  onSelectNavTab?: (tab: 'home' | 'estimator' | 'consumer' | 'hallmarking' | 'info') => void;
}

export const InfoGuideView: React.FC<InfoGuideViewProps> = ({
  onOpenAssistant,
  onSelectNavTab,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const isTopicVisible = (sectionId: string) => {
    const meta = TOPIC_METADATA[sectionId];
    if (!meta) return true;

    if (activeCategory !== 'all' && meta.category !== activeCategory) {
      return false;
    }

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    return (
      sectionId.toLowerCase().includes(q) ||
      meta.keywords.some((kw) => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase()))
    );
  };

  const visibleCount = Object.keys(TOPIC_METADATA).filter(isTopicVisible).length;

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setHighlightedSection(sectionId);
      setTimeout(() => setHighlightedSection(null), 2500);
      try {
        window.history.replaceState(null, '', `#info#${sectionId}`);
      } catch {}
    }
  };

  const handleJumpToSection = (sectionId: string) => {
    setSearchQuery('');
    setActiveCategory('all');
    setTimeout(() => scrollToSection(sectionId), 50);
  };

  useEffect(() => {
    // Check if URL has an anchor on load
    const checkAndScroll = () => {
      const hash = window.location.hash;
      if (hash.includes('#section-')) {
        const target = hash.substring(hash.indexOf('#section-') + 1);
        setSearchQuery('');
        setActiveCategory('all');
        setTimeout(() => scrollToSection(target), 150);
      }
    };
    checkAndScroll();

    const handleCustomNav = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: string; sectionId?: string }>;
      if (customEvent.detail?.sectionId) {
        setSearchQuery('');
        setActiveCategory('all');
        setTimeout(() => scrollToSection(customEvent.detail.sectionId!), 150);
      }
    };

    window.addEventListener('hashchange', checkAndScroll);
    window.addEventListener('manak_setu_navigate', handleCustomNav);

    return () => {
      window.removeEventListener('hashchange', checkAndScroll);
      window.removeEventListener('manak_setu_navigate', handleCustomNav);
    };
  }, []);

  const flowchartSteps = [
    {
      id: 'section-product-profile',
      number: '1',
      title: t('infoGuide.step1Title', 'Product Profile'),
      subtitle: t('infoGuide.step1Sub', 'Scope & Enterprise Scale'),
      desc: t('infoGuide.step1Desc', 'Define product name, technical category, MSME enterprise scale (for 50% statutory fee concessions), and manufacturing location.'),
      targetId: 'section-product-profile',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'section-applicable-standard',
      number: '2',
      title: t('infoGuide.step2Title', 'Applicable Standard'),
      subtitle: t('infoGuide.step2Sub', 'Indian Standard (IS Code)'),
      desc: t('infoGuide.step2Desc', 'Identify authoritative Indian Standards (e.g., IS 302-2-3, IS 1417) formulated by BIS Sectional Technical Committees.'),
      targetId: 'section-applicable-standard',
      color: 'from-indigo-600 to-violet-600',
    },
    {
      id: 'section-certification-qco',
      number: '3',
      title: t('infoGuide.step3Title', 'Certification / QCO'),
      subtitle: t('infoGuide.step3Sub', 'Statutory Mandate & Scheme'),
      desc: t('infoGuide.step3Desc', 'Determine whether compliance is mandatory under Central Line Ministry Gazette QCOs or voluntary under Scheme-I / CRS.'),
      targetId: 'section-certification-qco',
      color: 'from-violet-600 to-purple-600',
    },
    {
      id: 'section-testing-labs',
      number: '4',
      title: t('infoGuide.step4Title', 'Testing & Labs'),
      subtitle: t('infoGuide.step4Sub', 'In-House SIT & NABL Labs'),
      desc: t('infoGuide.step4Desc', 'Review Scheme of Inspection and Testing (SIT), routine QC apparatus, and find accredited testing labs with distance routes.'),
      targetId: 'section-testing-labs',
      color: 'from-purple-600 to-fuchsia-600',
    },
    {
      id: 'section-documents',
      number: '5',
      title: t('infoGuide.step5Title', 'Documents'),
      subtitle: t('infoGuide.step5Sub', 'Statutory Form-V & Checklist'),
      desc: t('infoGuide.step5Desc', 'Prepare Form-V, machinery lists, test equipment calibration records, factory layout, Udyam certificate, and chemist appointment.'),
      targetId: 'section-documents',
      color: 'from-fuchsia-600 to-pink-600',
    },
    {
      id: 'section-application',
      number: '6',
      title: t('infoGuide.step6Title', 'Application'),
      subtitle: t('infoGuide.step6Sub', 'e-BIS Manakonline Filing'),
      desc: t('infoGuide.step6Desc', 'Submit statutory filing on Manakonline, undergo document scrutiny, factory inspection, sample testing, and receive CM/L licence.'),
      targetId: 'section-application',
      color: 'from-pink-600 to-emerald-600',
    },
  ];

  const categories = [
    { id: 'all', label: t('infoGuide.catAll', 'All Topics (11)') },
    { id: 'statutory', label: t('infoGuide.catStatutory', 'Statutory & Regulatory') },
    { id: 'technical', label: t('infoGuide.catTechnical', 'Testing & Quality') },
    { id: 'consumer', label: t('infoGuide.catConsumer', 'Consumer & Precious Metals') },
    { id: 'architecture', label: t('infoGuide.catArchitecture', 'How It Works') },
  ];

  return (
    <div className="flex-1 bg-slate-50 pb-20">
      {/* Hero Header Strip */}
      <div className="bg-gradient-to-b from-bis-950 via-bis-900 to-bis-850 text-white border-b border-bis-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('infoGuide.badge', 'Knowledge & Compliance Guide • मानक सेतु मार्गदर्शिका')}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight text-white leading-tight">
                {t('infoGuide.title', 'BIS Standards, Certification & Regulatory Guide')}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
                {t('infoGuide.subtitle', 'Comprehensive educational guidance on Indian Standards, Quality Control Orders (QCOs), testing protocols, statutory documentation, hallmarking, and consumer rights — backed strictly by verified official BIS regulations.')}
              </p>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-bis-800/80 backdrop-blur-sm border border-bis-700/60 rounded-2xl p-4 sm:p-5 w-full md:w-80 shadow-lg shrink-0 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('infoGuide.readyTitle', 'Ready to start compliance?')}</span>
              </div>
              <div className="space-y-2">
                {onSelectNavTab && (
                  <>
                    <button
                      onClick={() => onSelectNavTab('home')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-sm group"
                    >
                      <span className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-slate-950" />
                        <span>{t('infoGuide.startGuide', 'Start Product Guide')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={() => onSelectNavTab('estimator')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-bis-700 hover:bg-bis-600 text-white font-semibold text-xs transition-all border border-bis-600 group"
                    >
                      <span className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-amber-300" />
                        <span>{t('infoGuide.estimateFees', 'Estimate BIS Fees')}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onOpenAssistant('Give me a high-level summary of the BIS certification process for Indian manufacturers.')}
                  className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 font-medium text-xs transition-all border border-slate-700 group"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('infoGuide.askAi', 'Ask Manak Setu AI')}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Search & Topic Filters */}
          <div className="mt-8 pt-6 border-t border-bis-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('infoGuide.searchPlaceholder', 'Search topics (e.g. QCO, HUID, Form-V, SIT)...')}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-bis-800/60 text-white placeholder-slate-400 border border-bis-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-bis-800 text-slate-300 hover:text-white hover:bg-bis-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* SECTION: Interactive Visual Flowchart */}
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('infoGuide.flowchartBadge', 'Interactive Visual Roadmap')}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-900 tracking-tight">
                {t('infoGuide.flowchartTitle', 'BIS Compliance & Certification Lifecycle Flowchart')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t('infoGuide.flowchartSubtitle', 'Click any stage in the flow below to immediately jump to its detailed educational guide and requirements.')}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-medium self-start sm:self-auto bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              💡 <span>{t('infoGuide.flowchartHint', 'Click any node to navigate')}</span>
            </div>
          </div>

          {/* Visual Step Cards / Flow Track */}
          <div className="mt-8 space-y-6">
            {/* Start Node */}
            <div className="flex items-center justify-center">
              <div className="px-5 py-2 rounded-full bg-slate-900 text-white text-xs font-black tracking-wider uppercase shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('infoGuide.flowchartStart', 'START: Product Conception & Manufacturing')}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-slate-400 stroke-[2.5]" />
            </div>

            {/* 6 Grid Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flowchartSteps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => handleJumpToSection(step.targetId)}
                  className="group relative cursor-pointer rounded-2xl p-5 border border-slate-200 hover:border-amber-400/80 bg-white hover:bg-amber-50/20 transition-all hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`w-7 h-7 rounded-xl bg-gradient-to-br ${step.color} text-white font-black text-xs flex items-center justify-center shadow-xs`}>
                        {step.number}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">
                        {t('infoGuide.stepPrefix', 'Step')} {step.number}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-bis-900 transition-colors flex items-center gap-1.5">
                      <span>{step.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {step.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-bis-800">
                    <span>{t('infoGuide.flowchartJump', 'Jump to Explanation')}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <ArrowDown className="w-5 h-5 text-slate-400 stroke-[2.5]" />
            </div>

            {/* End Node & Parallel Hallmarking Branch */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Certification Grant (End of Product Flow) */}
              <div 
                onClick={() => handleJumpToSection('section-application')}
                className="cursor-pointer rounded-2xl p-5 border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50 to-teal-50 hover:bg-emerald-100/40 transition-all shadow-xs group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                    {t('infoGuide.flowchartEndOutput', 'Product Flow Output (END)')}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-900">
                    {t('infoGuide.flowchartEndTitle', 'Grant of BIS CM/L Licence & ISI Mark')}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {t('infoGuide.flowchartEndDesc', 'Receipt of unique CM/L licence number, endorsement of Scheme of Inspection & Testing (SIT), and permission to affix Standard ISI Mark.')}
                  </p>
                </div>
              </div>

              {/* Parallel Hallmarking Branch */}
              <div
                onClick={() => handleJumpToSection('section-hallmarking')}
                className="cursor-pointer rounded-2xl p-5 border-2 border-amber-500/40 bg-gradient-to-br from-amber-50 to-orange-50 hover:bg-amber-100/40 transition-all shadow-xs group flex items-start gap-3.5"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Gem className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                    {t('infoGuide.flowchartHallmarkingBranch', 'Parallel BIS Pathway')}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-900 flex items-center gap-1.5">
                    <span>{t('infoGuide.flowchartHallmarkingTitle', 'Precious Metals: Hallmarking & HUID')}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-1 transition-transform" />
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {t('infoGuide.flowchartHallmarkingDesc', 'Specialized pathway for Gold (IS 1417) and Silver (IS 2112) articles, jeweller registration, and 6-digit laser-engraved HUID at recognized A&H Centres.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* TOPIC 1: BIS (Bureau of Indian Standards) Overview                        */}
        {/* ========================================================================= */}
        <div
          id="section-bis"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-bis'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-bis') ? 'hidden' : ''}`}
        >
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-bis-900 text-white flex items-center justify-center font-black text-xs">
                  01
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-bis-800 bg-bis-100/80 px-2.5 py-1 rounded-lg">
                  Statutory Apex Body
                </span>
              </div>
              <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
                1. Bureau of Indian Standards (BIS) Overview
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                The <strong>Bureau of Indian Standards (BIS)</strong> is the National Standards Body of India established under the <strong>BIS Act, 2016</strong> (which replaced the earlier BIS Act of 1986). BIS operates under the administrative authority of the <em>Department of Consumer Affairs, Ministry of Consumer Affairs, Food & Public Distribution, Government of India</em>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-bis-800" />
                    <span>Standards Formulation</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Formulates harmonized national specifications covering safety, mechanical integrity, environmental benchmarks, and performance metrics across 15 technical divisions.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Product Certification</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Administers the internationally acclaimed <strong>ISI Mark</strong> (Scheme-I) and Compulsory Registration Scheme (Scheme-II CRS) guaranteeing product quality.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Gem className="w-4 h-4 text-amber-600" />
                    <span>Hallmarking of Precious Metals</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Regulates the assaying and laser-engraving of 6-digit alphanumeric HUID marks on gold and silver articles to protect consumer investments from adulteration.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-blue-600" />
                    <span>Laboratory Network & Surveillance</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Maintains central, regional, and branch testing facilities, coordinates market surveillance, and audits manufacturing facilities for ongoing compliance.
                  </p>
                </div>
              </div>

              {/* Verified Sources & AI Trigger */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <a
                  href="https://www.bis.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <span>{t('infoGuide.officialBisPortal', 'Official BIS Portal')}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
                <button
                  onClick={() => onOpenAssistant('Explain the statutory mandate of BIS under the BIS Act 2016 and how it enforces consumer safety.')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{t('infoGuide.askAiAboutBis', 'Ask Manak Setu AI about BIS')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 2: Indian Standards (IS Specifications)                             */}
        {/* ========================================================================= */}
        <div
          id="section-applicable-standard"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-applicable-standard'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-applicable-standard') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                02
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-100/80 px-2.5 py-1 rounded-lg">
                Technical Specifications
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              2. Indian Standards (IS Specifications)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              An <strong>Indian Standard (IS)</strong> is an authoritative technical standard formulated through consensus by Sectional Committees consisting of scientists, testing laboratories, industry associations, and consumer advocates. Over 21,000 Indian Standards exist, establishing benchmarks for raw material grades, tolerances, safety thresholds, and testing methods.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Understanding IS Codes & Numbering Structure
              </h4>
              <p className="text-xs text-slate-600">
                Each standard follows a specific identifier notation:
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono font-bold text-bis-900 bg-bis-50 px-2 py-0.5 rounded border border-bis-200 shrink-0">
                    IS 302-2-3
                  </span>
                  <span className="text-slate-700">
                    <strong>Specific Appliance Safety:</strong> Safety of Household and Similar Electrical Appliances — Particular Requirements for Electric Irons.
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono font-bold text-bis-900 bg-bis-50 px-2 py-0.5 rounded border border-bis-200 shrink-0">
                    IS 14543
                  </span>
                  <span className="text-slate-700">
                    <strong>Food & Health Safety:</strong> Packaged Drinking Water (Other than Packaged Natural Mineral Water) Specification.
                  </span>
                </div>
                <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-mono font-bold text-bis-900 bg-bis-50 px-2 py-0.5 rounded border border-bis-200 shrink-0">
                    IS 1417
                  </span>
                  <span className="text-slate-700">
                    <strong>Precious Metals:</strong> Gold and Gold Alloys, Jewellery/Artefacts — Fineness and Marking Specification.
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-slate-700">
              <strong className="text-amber-900 font-bold">Voluntary vs. Mandatory Standards:</strong> By default, Indian Standards are voluntary guidelines for quality enhancement. However, once the Government of India notifies a product under a <em>Quality Control Order (QCO)</em>, compliance with the relevant Indian Standard becomes an absolute statutory mandate.
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <span>{t('infoGuide.knowYourStandard', 'Know Your Standard (e-BIS Portal)')}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              <button
                onClick={() => onOpenAssistant('How do I identify the exact Indian Standard (IS code) that applies to my product?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutStandards', 'Ask AI about Standards')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 3: Certification Schemes (Scheme-I, CRS, FMCS, Tatkal)              */}
        {/* ========================================================================= */}
        <div
          id="section-certification-schemes"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-certification-schemes'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-certification-schemes') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-xs">
                03
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-violet-800 bg-violet-100/80 px-2.5 py-1 rounded-lg">
                Conformity Assessment Schemes
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              3. BIS Certification Schemes (Scheme-I, CRS, FMCS)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              BIS operates distinct Conformity Assessment Schemes tailored to product risks, manufacturing infrastructure, and regulatory requirements under the BIS (Conformity Assessment) Regulations, 2018:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-bis-950 uppercase tracking-wider">
                    Scheme-I (ISI Mark)
                  </span>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Domestic Scheme
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The standard certification scheme for physical consumer goods, industrial equipment, cement, food, and automotive parts. Requires in-house QC laboratory apparatus, qualified technical chemist, preliminary factory inspection, and counter-sample testing. Results in the grant of a 7-digit <strong>CM/L Licence</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-bis-950 uppercase tracking-wider">
                    Scheme-II (CRS - Registration)
                  </span>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Electronics & IT Goods
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compulsory Registration Scheme for electronics, LED luminaires, power adapters, laptops, mobile phones, and inverters notified by MeitY. Based on self-declaration of conformity supported by independent testing in BIS-recognized laboratories without mandatory initial factory audits. Grants an <strong>R-Number</strong> (e.g. R-XXXXXXXX).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-bis-950 uppercase tracking-wider">
                    FMCS (Foreign Manufacturers)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                    Overseas Manufacturing
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Operates under Scheme-I for foreign manufacturers located outside India seeking to export products to India. Requires an Indian Authorized Representative (AIR), physical audit of overseas factory premises, drawing of counter-samples, and adherence to Indian Standards before customs entry.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-bis-950 uppercase tracking-wider">
                    Simplified / Tatkal Procedure
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Expedited (30 Days)
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Expedited route for domestic manufacturers who pre-test product samples in BIS-recognized labs prior to filing. Reduces the licensing turnaround time from 2–3 months to under 30 days for low- and medium-risk commodity categories.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenAssistant('What is the difference between Scheme-I (ISI Mark) and Scheme-II (CRS) under BIS?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutSchemes', 'Ask AI about Certification Schemes')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 4: Quality Control Orders (QCO)                                     */}
        {/* ========================================================================= */}
        <div
          id="section-certification-qco"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-certification-qco'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-certification-qco') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                04
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-red-800 bg-red-100/80 px-2.5 py-1 rounded-lg">
                Mandatory Gazette Regulation
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              4. Quality Control Orders (QCO)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              A <strong>Quality Control Order (QCO)</strong> is an executive order issued by Central Government Ministries (such as DPIIT, Ministry of Steel, MeitY, Ministry of Heavy Industries, Ministry of Textiles, etc.) invoking <strong>Section 16 of the BIS Act, 2016</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-2">
              <h4 className="text-xs font-bold text-red-950 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Strict Legal Enforceability & Penalties</span>
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                Once a QCO comes into force for a product:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                <li>No person shall manufacture, import, distribute, sell, store, or exhibit for sale any product covered by the QCO unless it conforms to the specified Indian Standard and bears the Standard Mark (ISI / CRS).</li>
                <li>Violations are treated as criminal offenses under <strong>Section 29 of the BIS Act, 2016</strong>, punishable with imprisonment up to 2 years, severe monetary fines (up to 10 times the value of goods), and confiscation of non-compliant inventory.</li>
                <li>Customs authorities will seize imported consignments at Indian ports if they lack an active FMCS license or CRS registration number.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider">
                MSME Implementation Timelines
              </div>
              <p className="leading-relaxed">
                To support domestic industrial transition, QCO notifications typically establish staggered enforcement timelines:
                General industry usually receives 6 months from publication; Small enterprises receive an additional 3 months; and Micro enterprises receive an additional 6 months.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenAssistant('What are the legal consequences of non-compliance with a Quality Control Order (QCO)?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutQco', 'Ask AI about QCO Mandates')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 5: Testing & Laboratories                                          */}
        {/* ========================================================================= */}
        <div
          id="section-testing-labs"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-testing-labs'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-testing-labs') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-xs">
                05
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-lg">
                Technical Validation & Quality Control
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              5. Testing & Laboratories
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Product conformity under Scheme-I requires a dual testing framework: internal continuous process control by the manufacturer and independent validation by BIS-recognized laboratory facilities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-bis-800" />
                  <span>1. In-House QC Lab & SIT</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every manufacturing unit must install and maintain testing equipment as specified in the BIS <strong>Scheme of Inspection and Testing (SIT)</strong>. Routine tests (e.g. high-voltage withstand, leakage current, tensile strength, dimension verification) must be performed on every production batch and logged in calibration-controlled registers.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-teal-700" />
                  <span>2. Independent Conformity Labs</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Independent testing takes place in BIS Central Laboratory (Sahibabad), Regional Laboratories (Chennai, Kolkata, Mumbai, Chandigarh), or commercial laboratories accredited by <strong>NABL (ISO/IEC 17025)</strong> and recognized under the BIS Laboratory Recognition Scheme (LRS).
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-bold text-slate-900">
                Sample Drawing Protocol during Factory Audits:
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                During the preliminary inspection, the BIS inspecting officer verifies the in-house testing apparatus, witnesses tests conducted by the factory chemist, and seals two sets of sample consignments: one sample dispatched directly to an independent recognized lab for full testing, and one counter-sample sealed and retained at the factory.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="https://nabl-india.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <span>{t('infoGuide.nablDirectory', 'NABL Accredited Labs Directory')}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              <button
                onClick={() => onOpenAssistant('What apparatus is mandatory for an in-house laboratory under the Scheme of Inspection and Testing (SIT)?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutTesting', 'Ask AI about Testing & SIT')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 6: Statutory Application Documents                                  */}
        {/* ========================================================================= */}
        <div
          id="section-documents"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-documents'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-documents') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-xs">
                06
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-pink-800 bg-pink-100/80 px-2.5 py-1 rounded-lg">
                Statutory Filings
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              6. Statutory Application Documents
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Applying for a BIS CM/L licence requires comprehensive statutory documentation to demonstrate legal entity status, manufacturing capability, quality control infrastructure, and technical personnel competence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-pink-700" />
                  <span>1. Form-V (Statutory Application)</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Primary formal application declaring the applicant entity, manufacturing premises, target standard, and registered trade brand names.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-pink-700" />
                  <span>2. Business Entity Registration</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  GST Certificate, Certificate of Incorporation (ROC) / Partnership Deed, and Udyam MSME Registration Certificate (for 50% fee concession).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Factory className="w-4 h-4 text-pink-700" />
                  <span>3. Machinery & Equipment List</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Detailed schedule of all production machinery with horse-power, daily manufacturing capacities, make, and automated safety interlocks.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-pink-700" />
                  <span>4. Test Apparatus with NABL Calibration</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Schedule of testing equipment conforming to the SIT, accompanied by valid calibration certificates issued by an accredited NABL calibration lab.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-pink-700" />
                  <span>5. Factory Layout Plan</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Blueprint depicting production floors, raw material storage, dedicated in-house QC laboratory, and quarantined non-conforming goods area.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-pink-700" />
                  <span>6. Trademark & Personnel Papers</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Registered Trademark certificate / TM-A application, plus appointment letter and qualification credentials of the QC Technical Chemist.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenAssistant('What is Form-V in BIS application and what documents must be attached for Scheme-I?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutDocs', 'Ask AI about Required Documents')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 7: Application Process on e-BIS (Manakonline)                        */}
        {/* ========================================================================= */}
        <div
          id="section-application"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-application'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-application') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                07
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                Statutory e-Filing
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              7. Application Process on e-BIS (Manakonline)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              All domestic and foreign BIS applications are processed 100% digitally through the official <strong>Manakonline (e-BIS)</strong> portal (`manakonline.in`). Physical paper applications are no longer accepted.
            </p>

            {/* Stepper Breakdown */}
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-bis-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  1
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Portal Registration & Profile Setup</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Register corporate credentials, PAN, GST, and factory location on the Manakonline portal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-bis-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Form-V Filing & Document Upload</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Fill in standard selection, production scope, test apparatus details, and upload the statutory document portfolio.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-bis-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  3
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Statutory Application Fee Payment</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Pay statutory application fee (₹1,000 for standard enterprises; 50% concession ₹500 for micro/small enterprises with valid Udyam).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-bis-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  4
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Scrutiny & Factory Verification Audit</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    BIS Technical Officer reviews submitted files and schedules an on-site factory audit to verify equipment and draw counter-samples.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="w-6 h-6 rounded-full bg-bis-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  5
                </span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Sample Clearance & Licence Grant (CM/L)</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Upon positive laboratory test reports and payment of the annual minimum marking fee, BIS issues the formal CM/L licence certificate.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="https://www.manakonline.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-xs"
              >
                <span>{t('infoGuide.openManakonline', 'Open Official Manakonline (e-BIS) Portal')}</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </a>
              <button
                onClick={() => onOpenAssistant('What are the official fee structures and timelines for obtaining a BIS licence on Manakonline?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutEbis', 'Ask AI about e-BIS Filing')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 8: Hallmarking (Gold IS 1417 & Silver IS 2112, HUID)                */}
        {/* ========================================================================= */}
        <div
          id="section-hallmarking"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-hallmarking'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-hallmarking') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-xs">
                08
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                Precious Metals & Purity
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              8. Hallmarking of Gold & Silver (IS 1417 & IS 2112)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Hallmarking</strong> is the accurate determination and official recording of the proportionate content of precious metal in gold or silver articles. Hallmarking is governed by <strong>IS 1417</strong> for Gold & Gold Alloys, and <strong>IS 2112</strong> for Silver.
            </p>

            {/* 3 Marks Guide Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-600" />
                <span>The 3 Mandatory Marks on Hallmarked Gold Jewellery</span>
              </div>
              <p className="text-xs text-slate-700">
                Every genuine piece of hallmarked gold jewellery sold in India must bear exactly 3 laser-engraved markings:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-900">1. BIS Standard Logo</div>
                  <div className="text-2xl font-serif text-amber-600 font-black">▲</div>
                  <div className="text-[11px] text-slate-600">The triangular BIS mark certifying authenticity.</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-900">2. Purity / Fineness Grade</div>
                  <div className="font-mono text-sm font-black text-amber-700 bg-amber-50 py-1 rounded border border-amber-200">
                    22K916
                  </div>
                  <div className="text-[11px] text-slate-600">22 Karat (91.6%), 18 Karat (75.0%), 14 Karat (58.5%).</div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-900">3. 6-Digit HUID</div>
                  <div className="font-mono text-sm font-black text-amber-700 bg-amber-50 py-1 rounded border border-amber-200">
                    ABC123
                  </div>
                  <div className="text-[11px] text-slate-600">Unique alphanumeric identification laser-engraved at AHC.</div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
              <strong>Zero Statutory Fee for Jeweller Registration:</strong> Under the national hallmarking mandate, jewellers register online on Manakonline with zero statutory fee. Retailers dispatch jewellery to BIS-recognized Assaying and Hallmarking Centres (AHCs) which perform fire assay/XRF testing and laser-engrave the HUID.
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onSelectNavTab && (
                <button
                  onClick={() => onSelectNavTab('hallmarking')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-xs"
                >
                  <Gem className="w-3.5 h-3.5" />
                  <span>{t('infoGuide.goToHallmarkingPortal', 'Go to Dedicated Hallmarking Portal')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => onOpenAssistant('What are the 3 mandatory marks on hallmarked gold jewellery and what is HUID?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutHallmarking', 'Ask AI about Hallmarking')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 9: Consumer Verification & Rights (BIS Care App)                    */}
        {/* ========================================================================= */}
        <div
          id="section-consumer-verification"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-consumer-verification'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-consumer-verification') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center font-black text-xs">
                09
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-100/80 px-2.5 py-1 rounded-lg">
                Consumer Protection
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              9. Consumer Verification & Rights (BIS Care App)
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              Indian consumers have statutory rights to verify the authenticity of certification marks and report substandard or counterfeit products directly to regulatory enforcement teams.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-cyan-600" />
                  <span>The BIS Care Mobile App</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The official mobile application published by BIS (available for Android & iOS). Allows consumers to verify <strong>ISI CM/L numbers</strong>, <strong>CRS Registration numbers</strong>, and <strong>6-digit gold HUIDs</strong> instantly on their phones.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-cyan-600" />
                  <span>Grievance Redressal & Complaints</span>
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If an article bearing an ISI mark fails to perform or a hallmarked jewellery piece is suspected to have low purity, consumers can file an online grievance with photograph evidence. BIS enforcement teams conduct market raids and sample seizures based on valid consumer complaints.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <span>{t('infoGuide.bisCareWebPortal', 'BIS Care Web Verification Portal')}</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
              {onSelectNavTab && (
                <button
                  onClick={() => onSelectNavTab('consumer')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-bold transition-colors"
                >
                  <HelpCircle className="w-3 h-3 text-white" />
                  <span>{t('infoGuide.openConsumerHelp', 'Open Consumer Help')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 10: How Manak Setu Works                                            */}
        {/* ========================================================================= */}
        <div
          id="section-how-manak-setu-works"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-how-manak-setu-works'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-how-manak-setu-works') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-bis-950 text-amber-400 flex items-center justify-center font-black text-xs">
                10
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-bis-900 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                AI Architecture & Intelligence
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              10. How Manak Setu Works
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              <strong>Manak Setu (मानक सेतु)</strong> is an AI-powered compliance intelligence assistant designed specifically for Indian Standards and BIS services under Smart India Hackathon Problem Statement 26107.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-bis-800" />
                  <span>Hybrid RAG Architecture</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Combines semantic vector embeddings (pgvector) with PostgreSQL BM25 full-text keyword matching using <em>Reciprocal Rank Fusion (RRF)</em> to guarantee high retrieval precision.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Zero Regulatory Hallucination</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every response is grounded strictly in official BIS documentation, verified gazette notifications, and standard schedules. Citations link directly to official sources.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Context-Aware Assistant</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The persistent assistant tracks your active page, product details, selected standard code, enterprise scale, and compliance stage to deliver hyper-relevant answers.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenAssistant('How does the Manak Setu Hybrid RAG system ensure factual compliance responses?')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bis-900 hover:bg-bis-800 text-white text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{t('infoGuide.askAiAboutArchitecture', 'Ask AI about Manak Setu Architecture')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOPIC 11: How the Product Guide 6-Stage Flow Works                        */}
        {/* ========================================================================= */}
        <div
          id="section-product-guide-flow"
          className={`scroll-mt-24 transition-all duration-300 rounded-3xl bg-white border p-6 sm:p-8 shadow-sm ${
            highlightedSection === 'section-product-guide-flow'
              ? 'border-amber-400 ring-4 ring-amber-100'
              : 'border-slate-200'
          } ${!isTopicVisible('section-product-guide-flow') ? 'hidden' : ''}`}
        >
          <div className="space-y-4 max-w-4xl">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                11
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                Product Guide Workflow
              </span>
            </div>
            <h2 className="text-2xl font-black font-serif text-slate-900 tracking-tight">
              11. How the Product Guide 6-Stage Flow Works
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              The <strong>Product Certification Guide</strong> breaks down complex BIS regulatory compliance into an intuitive, sequential 6-stage roadmap:
            </p>

            <div className="space-y-3 pt-1">
              <div id="section-product-profile" className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Stage 1: Product Profile</div>
                  <p className="text-xs text-slate-600 mt-0.5">Captures your product identity, industry category, enterprise scale (Micro, Small, Medium, Large), and manufacturing premises location.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Stage 2: Applicable Standard</div>
                  <p className="text-xs text-slate-600 mt-0.5">Intelligently queries the database to identify the primary Indian Standard (IS Code) and technical scope covering your product.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-violet-600 text-white text-xs font-black flex items-center justify-center shrink-0">3</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Stage 3: Certification / QCO</div>
                  <p className="text-xs text-slate-600 mt-0.5">Verifies whether your product is under a mandatory Quality Control Order (QCO), defines the certification scheme, and highlights enforcement deadlines.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-purple-600 text-white text-xs font-black flex items-center justify-center shrink-0">4</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Stage 4: Testing & Labs</div>
                  <p className="text-xs text-slate-600 mt-0.5">Maps out required routine tests under the SIT and discovers recognized laboratories near your facility with contact info and Google Maps routes.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-pink-600 text-white text-xs font-black flex items-center justify-center shrink-0">5</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Stage 5: Documents</div>
                  <p className="text-xs text-slate-600 mt-0.5">Provides a checklist of essential statutory documents (Form-V, machinery lists, calibration reports) with real-time scan analysis and verification status.</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0">6</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">Stage 6: Application</div>
                  <p className="text-xs text-slate-600 mt-0.5">Consolidates your completed compliance journey, displays your audit readiness score, and provides a direct gateway to file on e-BIS Manakonline.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              {onSelectNavTab && (
                <button
                  onClick={() => onSelectNavTab('home')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t('infoGuide.launchProductGuide', 'Launch Product Certification Guide')}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty State when no topics match search or category filter (Phase 17) */}
        {visibleCount === 0 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center space-y-5 max-w-2xl mx-auto animate-fade-in">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                No educational topics match "{searchQuery}"
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                We couldn't find any compliance guide sections matching your current filter. Try searching for terms like <strong>QCO</strong>, <strong>HUID</strong>, <strong>Form-V</strong>, <strong>SIT</strong>, <strong>MSME</strong>, or clear your search filters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-5 py-2.5 bg-bis-900 hover:bg-bis-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Search & View All 11 Topics</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
