import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Award, 
  ShieldCheck, 
  Search, 
  Paperclip, 
  Send, 
  Loader2, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  HelpCircle, 
  AlertCircle,
  Building2,
  Gem,
  Check,
  Copy,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Info,
  Clock,
  MapPin,
  Scale,
  Phone,
  Coins,
  Store,
  FileCheck
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { sendChatMessage, sendMultimodalMessage, verifyConsumerMark, ConsumerVerificationResult } from '../../services/api';
import { Citation } from '../../types/chat';
import { CitationsEvidenceGrid } from '../chat/CitationEvidenceCard';
import { PageInfoButton } from '../common/PageInfoButton';

interface HallmarkingViewProps {
  onOpenAssistant?: (prompt?: string) => void;
}

export const HallmarkingView: React.FC<HallmarkingViewProps> = ({ onOpenAssistant }) => {
  const { t, language } = useLanguage();

  // Top-level Navigation: Consumer vs Business Journey
  const [userRole, setUserRole] = useState<'consumer' | 'business'>('consumer');
  
  // Metal Selection: Gold vs Silver
  const [metalType, setMetalType] = useState<'gold' | 'silver'>('gold');

  // HUID Verifier State (Consumer Journey)
  const [huidCode, setHuidCode] = useState('');
  const [huidLoading, setHuidLoading] = useState(false);
  const [huidResult, setHuidResult] = useState<ConsumerVerificationResult | null>(null);
  const [huidError, setHuidError] = useState<string | null>(null);

  // Chat State
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string; citations?: Citation[]; filename?: string }>>([]);
  const [sessionId] = useState(() => `hallmarking_${Date.now()}`);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState<{ text: string; file?: File } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const huidAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (huidAbortRef.current) huidAbortRef.current.abort();
    };
  }, []);

  const goldPurityGrades = [
    { carat: '24K (999)', purity: '99.9% Fine Gold', use: 'Gold coins, bullion bars, investment ingots' },
    { carat: '23K (958)', purity: '95.8% Pure Gold', use: 'Traditional ceremonial jewellery' },
    { carat: '22K (916)', purity: '91.6% Pure Gold', use: 'Most popular Indian retail & bridal jewellery' },
    { carat: '20K (833)', purity: '83.3% Pure Gold', use: 'Studded & high-wear daily ornaments' },
    { carat: '18K (750)', purity: '75.0% Pure Gold', use: 'Diamond & precious gemstone studded jewellery' },
    { carat: '14K (585)', purity: '58.5% Pure Gold', use: 'Modern lightweight, daily wear & stone-set jewellery' },
  ];

  const silverPurityGrades = [
    { grade: '999', purity: '99.9% Fine Silver', use: 'Silver coins, minted bullion medallions, bars' },
    { grade: '990', purity: '99.0% Pure Silver', use: 'Religious idols, ceremonial silverware, utensils' },
    { grade: '970', purity: '97.0% Pure Silver', use: 'Traditional silver tableware, tea sets' },
    { grade: '925', purity: '92.5% Sterling Silver', use: 'International sterling silver jewellery, rings, chains' },
    { grade: '900', purity: '90.0% Pure Silver', use: 'Heavy ornaments, payals (anklets), traditional bangles' },
    { grade: '835', purity: '83.5% Pure Silver', use: 'Traditional filigree and decorative ware' },
    { grade: '800', purity: '80.0% Pure Silver', use: 'Enamelled silver artefacts, souvenir items' },
  ];

  const quickQuestions = [
    'What are the 3 mandatory marks on hallmarked gold jewellery in India?',
    'What are the consumer compensation rights under BIS Rule 49 if gold purity is low?',
    'How can a consumer check the 6-digit HUID code on the BIS Care Mobile App?',
    'What is the step-by-step procedure for a jeweller to obtain a BIS Hallmarking registration?',
    'What are the statutory assaying charges per gold article at an authorized AHC?'
  ];

  const businessSteps = [
    {
      step: 1,
      title: 'Applicable Requirements & Mandate',
      subtitle: metalType === 'gold' ? 'Standard: IS 1417' : 'Standard: IS 2112',
      badge: 'Statutory Standard',
      details: metalType === 'gold'
        ? 'Gold jewellery must conform to IS 1417 (24K, 23K, 22K, 20K, 18K, 14K). Mandatory hallmarking is currently enforced in 343+ notified districts under the Hallmarking of Gold Jewellery Order 2020.'
        : 'Silver jewellery and artefacts must conform to IS 2112 (999, 990, 970, 925, 900, 835, 800). Silver hallmarking operates under voluntary/notified frameworks.',
      actionNote: 'Verify district notification status on BIS portal.'
    },
    {
      step: 2,
      title: 'Eligibility & Statutory Exemptions',
      subtitle: 'Turnover & Weight Criteria',
      badge: 'Eligibility',
      details: 'Jewellers with an annual commercial turnover of up to ₹40 lakh are exempt from mandatory hallmarking requirements, but can register voluntarily. Individual articles weighing less than 2 grams are exempt from mandatory stamping.',
      actionNote: 'Review annual financial turnover and article weight thresholds.'
    },
    {
      step: 3,
      title: 'BIS Online Registration on Manakonline',
      subtitle: 'e-BIS Portal (manakonline.in)',
      badge: 'Portal Filing',
      details: 'Jewellers apply online via the e-BIS Manakonline portal. Under national ease-of-doing-business initiatives, registration is granted automatically on a self-declaration basis with trade licence and GST. Zero statutory registration fee is charged.',
      actionNote: 'Immediate generation of BIS Jeweller Registration Certificate.'
    },
    {
      step: 4,
      title: 'Locate Authorized Assaying & Hallmarking Centre',
      subtitle: 'BIS-Recognized AHC Network',
      badge: 'AHC Selection',
      details: 'Jewellers must submit jewellery lots to a BIS-recognized Assaying & Hallmarking Centre (AHC). Note: Generic product testing laboratories cannot hallmark jewellery; only recognized precious metal AHCs possess legal stamping authority.',
      actionNote: 'Use the official BIS Recognized AHC Directory to locate your nearest centre.'
    },
    {
      step: 5,
      title: 'Consignment Job Card & Lot Submission',
      subtitle: 'Lot Delivery Voucher',
      badge: 'Submission',
      details: 'Create a digital consignment batch on the e-BIS portal detailing total piece count, declared caratage/fineness, and gross weight. Hand over the physical lot securely to the AHC with the generated delivery voucher.',
      actionNote: 'AHC verifies physical lot weight against portal submission.'
    },
    {
      step: 6,
      title: 'Assaying & Conformity Testing Protocol',
      subtitle: 'XRF & Destructive Fire Assay',
      badge: 'Testing',
      details: 'AHC performs precision non-destructive X-ray Fluorescence (XRF) screening on every piece. A representative sample is tested by Fire Assay (IS 1418 for Gold / IS 2113 for Silver) to verify fineness parts-per-thousand.',
      actionNote: 'Purity must meet or exceed the declared statutory standard grade.'
    },
    {
      step: 7,
      title: 'Laser Inscription of 6-Digit HUID Code',
      subtitle: 'Central Database Inscription',
      badge: 'Marking',
      details: metalType === 'gold'
        ? 'Upon passing assay test, the AHC enters test results on the BIS portal. The portal generates a unique 6-digit alphanumeric HUID for each article. The AHC laser engraves the 3 marks: BIS Logo, Fineness Grade, and HUID.'
        : 'For silver, the AHC laser marks or stamps: BIS Logo, Fineness Grade (e.g. 925), AHC identification logo, and Jeweller mark.',
      actionNote: 'Each piece receives individual traceability in the BIS central system.'
    },
    {
      step: 8,
      title: 'Receiving Hallmarked Consignment',
      subtitle: 'Batch Retrieval',
      badge: 'Verification',
      details: 'The jeweller retrieves the hallmarked batch along with the AHC Delivery Memo and assay test certificates. Perform physical weight verification and visual inspection of laser markings.',
      actionNote: 'Verify invoice and nominal statutory assay charges (~₹45/article).'
    },
    {
      step: 9,
      title: 'Statutory Documentation & Inventory Audit',
      subtitle: 'Record Keeping',
      badge: 'Compliance',
      details: 'Record HUID numbers and AHC job-card references in statutory stock books, ERP software, and purchase ledgers. Maintain complete audit traceability for BIS inspection audits.',
      actionNote: 'Keep digital records of all hallmarked consignments.'
    },
    {
      step: 10,
      title: 'Retail Sale & Consumer Transparency',
      subtitle: 'Showroom Obligation',
      badge: 'Retail Sale',
      details: 'The jeweller must clearly state the 6-digit HUID code, net metal weight, and purity caratage on consumer sales invoices. Retail showrooms are legally obligated to prominently display the BIS Registration Certificate and provide a 10X magnifying loupe for consumers to view the hallmarks.',
      actionNote: 'Statutory consumer rights and clear invoice disclosures enforced.'
    }
  ];

  const handleVerifyHuid = async (codeToUse?: string) => {
    const code = (codeToUse || huidCode).trim().toUpperCase();
    if (!code || huidLoading) return;

    if (huidAbortRef.current) {
      huidAbortRef.current.abort();
    }
    const controller = new AbortController();
    huidAbortRef.current = controller;

    setHuidLoading(true);
    setHuidError(null);
    setHuidResult(null);

    try {
      const res = await verifyConsumerMark({
        queryType: 'huid',
        code,
        language,
        signal: controller.signal,
      });
      setHuidResult(res);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout;
      setHuidError(
        isTimeout
          ? (t('common.aiTimeout') || 'Verification took longer than expected. Please retry.')
          : (t('common.apiUnavailable') || 'Failed to verify HUID format. Please try again.')
      );
    } finally {
      setHuidLoading(false);
      huidAbortRef.current = null;
    }
  };

  const handleAsk = async (textToSubmit?: string) => {
    const q = (textToSubmit || query).trim();
    if ((!q && !selectedFile) || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const file = selectedFile || undefined;
    const userDisplay = q || (file ? `Uploaded ${file.name} for hallmarking analysis` : '');

    setLastQuery({ text: q, file });
    setHistory((prev) => [...prev, { role: 'user', text: userDisplay, filename: file?.name }]);
    setQuery('');
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      let res;
      if (file) {
        res = await sendMultimodalMessage(sessionId, q, file, language, controller.signal);
      } else {
        res = await sendChatMessage(
          sessionId, 
          q, 
          language, 
          { 
            page: 'hallmarking',
            tab: 'hallmarking',
            userType: userRole,
            user_type: userRole,
            metal: metalType,
            stage: userRole === 'business' ? 'Business 10-Stage Roadmap' : 'Consumer Hallmark Verification',
          }, 
          controller.signal
        );
      }

      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.reply,
          citations: res.citations,
        },
      ]);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const isTimeout = err.name === 'ApiTimeoutError' || err.isTimeout || err.message?.includes('timeout');
      const errText = isTimeout
        ? (t('common.aiTimeout') || 'Hallmarking inquiry is taking longer than expected. Please retry.')
        : (err.message || t('common.apiUnavailable') || 'Unable to retrieve hallmarking standard answer. Please try again.');

      setErrorMessage(errText);
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ **${errText}**`,
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleRetryLast = () => {
    if (lastQuery) {
      handleAsk(lastQuery.text);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. Header Hero Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-amber-950 via-slate-900 to-bis-950 text-white shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-extrabold uppercase tracking-wider">
            <Gem className="w-4 h-4 text-amber-400" />
            <span>HALLMARKING • Gold & Silver • BIS Guidance</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://www.manakonline.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
            >
              <span>e-BIS Portal (manakonline.in)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 text-bis-950 text-xs font-bold hover:bg-amber-400 transition-colors"
            >
              <span>BIS Care App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <PageInfoButton
              sectionId="section-hallmarking"
              tooltip="Learn about Gold & Silver Hallmarking Regulations in the Guide"
              variant="dark"
              size="sm"
            />
          </div>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
            BIS Hallmarking of Gold & Silver Artefacts
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Statutory purity certification, Hallmark Unique Identification (HUID) traceability, and Assaying & Hallmarking Centre (AHC) procedures under the Bureau of Indian Standards Act 2016.
          </p>
        </div>

        {/* 2. Conceptual Structure: What Do You Want To Do? */}
        <div className="pt-2">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300/90 mb-3">
            What do you want to do?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CONSUMER JOURNEY CARD */}
            <div
              onClick={() => setUserRole('consumer')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                userRole === 'consumer'
                  ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-2 ring-amber-400/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Consumer Pathway
                  </span>
                  {userRole === 'consumer' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Check my hallmark
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verify 6-digit HUID codes, learn the 3 mandatory marks, understand purity grades, and know your legal compensation rights under BIS Rule 49.
                </p>
              </div>
              <button
                type="button"
                className={`w-fit px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  userRole === 'consumer'
                    ? 'bg-amber-500 text-bis-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>Start Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* BUSINESS JOURNEY CARD */}
            <div
              onClick={() => setUserRole('business')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                userRole === 'business'
                  ? 'bg-amber-500/15 border-amber-400 shadow-sm ring-2 ring-amber-400/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Business Pathway (Jewellers & Manufacturers)
                  </span>
                  {userRole === 'business' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Get my jewellery hallmarked
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Practical 10-step statutory roadmap for jewellers: portal registration, AHC selection, consignment submission, laser marking, and retail invoice disclosures.
                </p>
              </div>
              <button
                type="button"
                className={`w-fit px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  userRole === 'business'
                    ? 'bg-amber-500 text-bis-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span>Start Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metal Selector Switch: GOLD vs SILVER */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Select Precious Metal:
          </span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setMetalType('gold')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                metalType === 'gold'
                  ? 'bg-amber-500 text-bis-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gem className="w-3.5 h-3.5" />
              <span>Gold (IS 1417)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetalType('silver')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                metalType === 'silver'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Silver (IS 2112)</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {metalType === 'gold'
              ? 'Gold Hallmarking: 3 mandatory marks including 6-digit HUID.'
              : 'Silver Hallmarking: 4 statutory marks (Fineness 800 to 999).'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONSUMER JOURNEY CONTENT */}
      {/* ============================================================ */}
      {userRole === 'consumer' && (
        <div className="space-y-8 animate-fade-in">
          {/* A. What to Check: Mandatory Hallmark Marks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>
                  {metalType === 'gold'
                    ? 'The 3 Mandatory Marks on Genuine Hallmarked Gold'
                    : 'The 4 Statutory Marks on Genuine Hallmarked Silver'}
                </span>
              </h2>
              <span className="text-[11px] font-bold text-slate-500 font-mono">
                {metalType === 'gold' ? 'Standard: IS 1417' : 'Standard: IS 2112'}
              </span>
            </div>

            {metalType === 'gold' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-xs border border-amber-200">
                    01
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">1. BIS Standard Logo (Triangle)</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The official triangular BIS hallmark logo confirms that the precious metal has been assayed and certified by an authorized Assaying & Hallmarking Centre.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-xs border border-amber-200">
                    02
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">2. Purity / Fineness Grade</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Indicates the exact carat and fineness in parts-per-thousand (e.g., <strong>22K916</strong> = 91.6% pure gold; <strong>18K750</strong> = 75.0% pure gold; <strong>14K585</strong> = 58.5% pure gold).
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-extrabold text-xs border border-amber-200">
                    03
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">3. 6-Digit Alphanumeric HUID</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hallmark Unique Identification code laser-engraved on every single jewellery piece for individual end-to-end traceability against the central BIS database.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs border border-slate-300">
                    01
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">1. BIS Standard Logo</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Triangular mark confirming compliance with IS 2112 purity regulations.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs border border-slate-300">
                    02
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">2. Purity Grade</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Fineness number (e.g. <strong>999</strong>, <strong>925</strong> Sterling, <strong>900</strong>, <strong>800</strong>).
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs border border-slate-300">
                    03
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">3. AHC Centre Mark</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Identification logo/symbol of the licensed Assaying & Hallmarking Centre.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold text-xs border border-slate-300">
                    04
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">4. Jeweller's Mark</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Registered identification logo of the certified retail/manufacturing jeweller.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* B. What to Do: Interactive 6-Digit HUID Checker Tool */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-amber-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-600" />
                  <span>Consumer Hallmark Check: 6-Digit HUID Format Verifier</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verify the statutory syntax of the 6-character alphanumeric code laser-engraved on your gold jewellery.
                </p>
              </div>

              <a
                href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/care"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 self-start sm:self-center"
              >
                <span>Verify on BIS Care App</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-amber-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={huidCode}
                  onChange={(e) => setHuidCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyHuid(); }}
                  placeholder="Enter 6-digit alphanumeric HUID (e.g. AB12CD)"
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs sm:text-sm font-mono font-bold tracking-widest uppercase transition-all shadow-xs"
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyHuid()}
                disabled={!huidCode.trim() || huidLoading}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                {huidLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Validating Format...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Check HUID Format</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Sample quick chips */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-[11px] font-semibold">Test Sample Format:</span>
              <button
                type="button"
                onClick={() => { setHuidCode('AB12CD'); handleVerifyHuid('AB12CD'); }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-mono text-[11px] font-bold border border-amber-200 cursor-pointer"
              >
                AB12CD
              </button>
            </div>

            {/* Result display */}
            {huidResult && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-slide-up text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase ${
                    huidResult.title === 'INVALID HUID FORMAT' ? 'bg-rose-100 text-rose-800' :
                    huidResult.title === 'HUID NOT FOUND' ? 'bg-amber-100 text-amber-800' :
                    huidResult.title === 'VERIFICATION ERROR' ? 'bg-rose-100 text-rose-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {huidResult.title === 'INVALID HUID FORMAT' ? 'Invalid HUID Format' :
                     huidResult.title === 'HUID NOT FOUND' ? 'HUID NOT FOUND' :
                     huidResult.title === 'VERIFICATION ERROR' ? 'Verification Error' :
                     huidResult.title === 'HUID VERIFIED — DEMO DATA' ? 'HUID VERIFIED — DEMO DATA' :
                     'Valid Format'}
                  </span>
                  {huidResult.title === 'HUID VERIFIED — DEMO DATA' && huidResult.prototype_label && (
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wide">
                      {huidResult.prototype_label}
                    </span>
                  )}
                  <span className="font-mono font-bold text-amber-950">{huidResult.title}</span>
                </div>
                <p className="text-amber-900 leading-relaxed">{huidResult.description}</p>
                {huidResult.query_type === 'huid' && huidResult.huid && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">HUID</div><div className="font-mono font-bold text-slate-900">{huidResult.huid}</div></div>
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">Material</div><div className="font-bold text-slate-900">{huidResult.article_material || '—'}</div></div>
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">Purity</div><div className="font-bold text-slate-900">{huidResult.purity || '—'}</div></div>
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200"><div className="text-[10px] uppercase tracking-wide text-slate-500">Jeweller</div><div className="font-bold text-slate-900">{huidResult.jeweller_name || '—'}</div></div>
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200 sm:col-span-2"><div className="text-[10px] uppercase tracking-wide text-slate-500">AHC Centre</div><div className="font-bold text-slate-900">{huidResult.ahc_centre_name || '—'}</div></div>
                  </div>
                )}
                {huidResult.verification_steps && (
                  <ol className="list-decimal pl-5 space-y-1 text-amber-950 text-[11px]">
                    {huidResult.verification_steps.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ol>
                )}
                {/* Honest verification disclaimer */}
                <div className="p-3 rounded-xl bg-white border border-amber-200 text-slate-600 text-[11px] flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Statutory Note:</strong> Manak Setu validates syntax and demo-record lookup only. To verify the exact jeweller name, AHC centre, and official record, use the official <strong>BIS Care Mobile App</strong> or BIS portal.
                  </span>
                </div>
              </div>
            )}

            {huidError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{huidError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleVerifyHuid()}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('common.retry') || 'Retry'}</span>
                </button>
              </div>
            )}
          </div>

          {/* C. Where to Go & Suspicious Article Guidance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Where to Go */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-bis-700" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Where to Go for Verification
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you have purchased hallmarked jewellery and wish to verify its exact purity independently:
              </p>
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">1. Instant Digital Verification (BIS Care App)</div>
                  <div className="text-[11px] text-slate-600">
                    Enter the 6-digit HUID in the official BIS Care app to view the jeweller’s registration number, AHC centre details, and article type instantly.
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">2. Referral Testing at an Authorized AHC</div>
                  <div className="text-[11px] text-slate-600">
                    Any consumer has the legal right to take hallmarked jewellery to any BIS-recognized Assaying & Hallmarking Centre (AHC) for priority purity testing upon payment of a nominal statutory fee (~₹45 per article).
                  </div>
                </div>
              </div>
              <a
                href="https://www.services.bis.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-bis-700 hover:text-bis-900"
              >
                <span>Find Recognized AHCs on Official BIS Directory</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Suspicious Article & Compensation Rights */}
            <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-700" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  Suspicious Article Guidance & Compensation Rights
                </h3>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 text-amber-950 text-xs font-medium leading-relaxed">
                <strong>Statutory Right under BIS Rule 49:</strong> If hallmarked jewellery is tested and found to be of lower purity than marked, the customer is entitled to:
                <ul className="list-disc pl-5 mt-1.5 space-y-1 text-[11px]">
                  <li>Complete refund of the testing charges paid at the AHC.</li>
                  <li><strong>Two Times (2x) Compensation:</strong> The jeweller must pay compensation calculated as 2x the shortfall in purity for the entire weight of the article.</li>
                </ul>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="font-bold text-slate-900">What to do if verification fails or purity is disputed:</div>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                  <li>Obtain the official Assaying & Testing Report from the recognized AHC.</li>
                  <li>Present the report and original purchase tax invoice to the registered jeweller for statutory settlement.</li>
                  <li>If the jeweller fails to compensate, lodge a formal consumer grievance on the <strong>BIS Care App</strong> or call the National Consumer Helpline at <strong>1915</strong>.</li>
                </ol>
              </div>
            </div>
          </div>

          {/* D. Recognized Standards Purity Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                {metalType === 'gold'
                  ? 'Recognized Indian Standard Gold Fineness Grades (IS 1417)'
                  : 'Recognized Indian Standard Silver Fineness Grades (IS 2112)'}
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {metalType === 'gold' ? 'IS 1417:2016' : 'IS 2112:2014'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-2.5 px-3">Grade & Marking</th>
                    <th className="py-2.5 px-3">Fineness Purity</th>
                    <th className="py-2.5 px-3">Standard Statutory Use</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(metalType === 'gold' ? goldPurityGrades : silverPurityGrades).map((g: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold font-mono text-slate-900">
                        {g.carat || g.grade}
                      </td>
                      <td className="py-2.5 px-3 text-amber-800 font-semibold">{g.purity}</td>
                      <td className="py-2.5 px-3 text-slate-600">{g.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BUSINESS JOURNEY CONTENT (Jewellers & Manufacturers) */}
      {/* ============================================================ */}
      {userRole === 'business' && (
        <div className="space-y-8 animate-fade-in">
          {/* Business Intro Header */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Store className="w-4 h-4" />
              <span>Jeweller & Manufacturer Statutory Guide • {metalType === 'gold' ? 'Gold (IS 1417)' : 'Silver (IS 2112)'}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight">
              10-Stage Process to Get Your Jewellery Hallmarked
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Complete statutory procedure for retail and manufacturing jewellers under the Bureau of Indian Standards (Hallmarking) Regulations. Follow each milestone from portal registration to final retail invoice disclosure.
            </p>
          </div>

          {/* 10-Stage Step-by-Step Practical Guidance */}
          <div className="space-y-4">
            <div className="relative border-l-2 border-amber-200 ml-4 pl-6 sm:pl-8 space-y-6">
              {businessSteps.map((step) => (
                <div key={step.step} className="relative group">
                  <div className="absolute -left-[37px] sm:-left-[45px] top-0 w-8 h-8 rounded-full bg-amber-500 text-bis-950 font-extrabold text-xs flex items-center justify-center border-4 border-white shadow-xs">
                    {step.step}
                  </div>

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2.5 group-hover:border-amber-300 transition-colors shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded">
                          {step.badge}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                          {step.step}. {step.title}
                        </h4>
                      </div>
                      <span className="text-xs font-semibold text-slate-500 font-mono">
                        {step.subtitle}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {step.details}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-amber-900 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{step.actionNote}</span>
                      </span>
                      {step.step === 3 && (
                        <a
                          href="https://www.manakonline.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-bis-700 hover:text-bis-900 flex items-center gap-1 shrink-0"
                        >
                          <span>Register on Manakonline</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {step.step === 4 && (
                        <a
                          href="https://www.services.bis.gov.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-bis-700 hover:text-bis-900 flex items-center gap-1 shrink-0"
                        >
                          <span>Official AHC Directory</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DEDICATED HALLMARKING AI CONSULTATION & ATTACHMENT ANALYZER */}
      {/* ============================================================ */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 shrink-0 shadow-2xs">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Hallmarking AI Advisory & Hallmark Image/PDF Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Ask specific questions or upload jewellery hallmark photos / AHC test memos for standard verification.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300 w-fit">
            Authoritative Standard Citations
          </span>
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAsk(q)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-950 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>

        {/* Chat History Thread */}
        {history.length > 0 && (
          <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 max-h-96 overflow-y-auto custom-scrollbar">
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-bis-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-800 shadow-2xs space-y-3'
                  }`}
                >
                  {msg.filename && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300 bg-black/20 px-2 py-0.5 rounded w-fit mb-1">
                      <Paperclip className="w-3 h-3" />
                      <span>{msg.filename}</span>
                    </div>
                  )}

                  <div className="prose prose-slate max-w-none text-xs prose-headings:text-bis-900 prose-p:leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <CitationsEvidenceGrid citations={msg.citations} />
                  )}

                  {msg.role === 'assistant' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, idx)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIdx === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-amber-900 p-2.5 font-medium bg-amber-50 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Consulting official BIS Hallmarking regulatory documentation...</span>
              </div>
            )}
          </div>
        )}

        {/* Error Banner with Retry */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleRetryLast}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('common.retry') || 'Retry'}</span>
            </button>
          </div>
        )}

        {/* Selected Attachment Pill */}
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 w-fit">
            <Paperclip className="w-4 h-4 text-amber-700" />
            <span className="font-semibold">{selectedFile.name}</span>
            <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-amber-200 rounded text-amber-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-300 focus-within:border-amber-600 focus-within:ring-2 focus-within:ring-amber-100 rounded-2xl p-2 transition-all shadow-inner"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*,.doc,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-amber-900 transition-colors cursor-pointer"
            title="Upload hallmark photo or jewellery bill"
          >
            <Paperclip className="w-4 h-4 text-amber-700" />
          </button>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask any hallmarking question (e.g. 3 mandatory marks, how to verify HUID, AHC testing fees)..."
            disabled={isLoading}
            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 px-2 py-1"
          />

          <button
            type="submit"
            disabled={(!query.trim() && !selectedFile) || isLoading}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
              (query.trim() || selectedFile) && !isLoading
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <span>Ask Assistant</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
