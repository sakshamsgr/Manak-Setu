import React, { useState } from 'react';
import { 
  GitMerge, 
  Plus, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  ArrowDown, 
  ArrowUp, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  Layers,
  Save,
  X
} from 'lucide-react';
import { FlowNode } from '../../types/flowchart';
import { useLanguage } from '../../context/LanguageContext';

const DEFAULT_PRODUCT_FLOW: FlowNode[] = [
  {
    id: 'p1',
    stepNumber: 1,
    title: 'Product Information & Standard Identification',
    subtitle: 'Scope Definition',
    timeline: 'Days 1 - 3',
    description: 'Identify the exact Indian Standard (IS code) and Quality Control Order (QCO) applicability for the product.',
    action: 'Review Indian Standard specification & SIT on Manakonline',
    status: 'statutory',
  },
  {
    id: 'p2',
    stepNumber: 2,
    title: 'In-House Laboratory & SIT Apparatus Setup',
    subtitle: 'QC Infrastructure',
    timeline: 'Weeks 1 - 2',
    description: 'Install required testing apparatus and obtain NABL calibration certificates for all in-house test gauges.',
    action: 'Commission routine test bench & appoint qualified QC chemist',
    status: 'mandatory',
  },
  {
    id: 'p3',
    stepNumber: 3,
    title: 'Statutory Application Filing on Manakonline (e-BIS)',
    subtitle: 'Form-I Submission',
    timeline: 'Week 3',
    description: 'Submit online application with factory layout, machinery list, test equipment list, and Udyam MSME certificate.',
    action: 'Pay statutory application fee with 50% MSME concession',
    status: 'statutory',
  },
  {
    id: 'p4',
    stepNumber: 4,
    title: 'Preliminary Factory Audit & Counter-Sample Drawing',
    subtitle: 'Inspection by BIS Officer',
    timeline: 'Weeks 4 - 6',
    description: 'BIS Technical Officer visits factory premises, verifies manufacturing processes, witnesses routine tests, and draws independent counter-samples.',
    action: 'Seal and dispatch counter-samples to BIS recognized laboratory',
    status: 'audit',
  },
  {
    id: 'p5',
    stepNumber: 5,
    title: 'Independent Laboratory Conformity Testing',
    subtitle: 'NABL Lab Testing',
    timeline: 'Weeks 6 - 8',
    description: 'BIS Central Laboratory or recognized testing house conducts complete parameter conformity testing.',
    action: 'Track sample test report on LIMS portal',
    status: 'mandatory',
  },
  {
    id: 'p6',
    stepNumber: 6,
    title: 'Grant of BIS CM/L Licence & ISI Mark Affixation',
    subtitle: 'Licence Grant',
    timeline: 'Week 8 - 10',
    description: 'Upon positive test reports and audit clearance, BIS grants the CM/L licence number for commercial production.',
    action: 'Affix standard ISI mark with CM/L number on finished product packaging',
    status: 'final',
  },
];

const DEFAULT_HALLMARKING_FLOW: FlowNode[] = [
  {
    id: 'h1',
    stepNumber: 1,
    title: 'Jeweller Online Registration on Manakonline',
    subtitle: 'Portal Registration',
    timeline: 'Day 1',
    description: 'Retail & wholesale jewellers register online with trade licence and GST details. Zero statutory fee for registration under national mandate.',
    action: 'Obtain BIS Jeweller Registration Certificate',
    status: 'statutory',
  },
  {
    id: 'h2',
    stepNumber: 2,
    title: 'Article Consignment Handover to AHC',
    subtitle: 'AHC Dispatch',
    timeline: 'Day 2',
    description: 'Jeweller delivers manufactured gold/silver jewellery lots to BIS recognized Assaying & Hallmarking Centre (AHC).',
    action: 'Generate online job card with batch weight and carats on e-BIS',
    status: 'mandatory',
  },
  {
    id: 'h3',
    stepNumber: 3,
    title: 'Fire Assay & Non-Destructive XRF Testing',
    subtitle: 'Assaying & Testing',
    timeline: 'Hours 4 - 8',
    description: 'AHC conducts precision X-ray Fluorescence (XRF) and fire assay to determine exact gold fineness parts per thousand (e.g. 916 for 22K).',
    action: 'Verify metal purity meets or exceeds IS 1417 specification',
    status: 'audit',
  },
  {
    id: 'h4',
    stepNumber: 4,
    title: 'Laser Inscription of 6-Digit HUID Code',
    subtitle: 'Hallmark Marking',
    timeline: 'Hour 8 - 12',
    description: 'AHC laser-engraves the 3 mandatory marks: BIS triangle, fineness grade (e.g. 22K916), and unique 6-digit alphanumeric HUID code.',
    action: 'Upload HUID mapping to national BIS central repository',
    status: 'mandatory',
  },
  {
    id: 'h5',
    stepNumber: 5,
    title: 'Consumer Verification via BIS Care App',
    subtitle: 'Traceability & Trust',
    timeline: 'Instant',
    description: 'End consumer inputs the 6-digit HUID in the official BIS Care mobile app to verify purity grade, jeweller name, and AHC registration.',
    action: 'Instant digital certificate of authenticity delivered to consumer',
    status: 'final',
  },
];

export const JourneyFlowchartView: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'product' | 'hallmarking'>('product');
  const [productNodes, setProductNodes] = useState<FlowNode[]>(DEFAULT_PRODUCT_FLOW);
  const [hallmarkingNodes, setHallmarkingNodes] = useState<FlowNode[]>(DEFAULT_HALLMARKING_FLOW);
  
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FlowNode>>({});

  const currentNodes = activeTab === 'product' ? productNodes : hallmarkingNodes;
  const setCurrentNodes = activeTab === 'product' ? setProductNodes : setHallmarkingNodes;

  const handleStartEdit = (node: FlowNode) => {
    setEditingNodeId(node.id);
    setEditForm({ ...node });
  };

  const handleSaveEdit = () => {
    if (!editingNodeId) return;
    setCurrentNodes((prev) =>
      prev.map((n) => (n.id === editingNodeId ? { ...n, ...editForm } as FlowNode : n))
    );
    setEditingNodeId(null);
  };

  const handleDelete = (id: string) => {
    setCurrentNodes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      return filtered.map((n, idx) => ({ ...n, stepNumber: idx + 1 }));
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentNodes.length) return;

    setCurrentNodes((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((n, idx) => ({ ...n, stepNumber: idx + 1 }));
    });
  };

  const handleAddStep = () => {
    const newId = `custom_${Date.now()}`;
    const newStep: FlowNode = {
      id: newId,
      stepNumber: currentNodes.length + 1,
      title: 'New Milestone Step',
      subtitle: 'Statutory Procedure',
      timeline: 'Custom Timeline',
      description: 'Define the required statutory documentation, audit step, or testing parameter.',
      action: 'Specific action required by manufacturer or testing authority',
      status: 'mandatory',
    };
    setCurrentNodes((prev) => [...prev, newStep]);
    handleStartEdit(newStep);
  };

  const handleReset = () => {
    if (activeTab === 'product') {
      setProductNodes(DEFAULT_PRODUCT_FLOW);
    } else {
      setHallmarkingNodes(DEFAULT_HALLMARKING_FLOW);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-bis-950 to-slate-900 text-white shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-bis-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider">
            <GitMerge className="w-4 h-4 text-amber-400" />
            <span>Interactive Data-Driven Process Workflow Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('demonstration.resetFlow')}</span>
            </button>
            <button
              onClick={handleAddStep}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-bis-950 text-xs font-extrabold transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t('demonstration.addStep')}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 max-w-3xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            {t('demonstration.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t('demonstration.subtitle')} Nodes and connections are separated from the UI logic and can be dynamically customized.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="pt-2 flex flex-wrap gap-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('product')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'product'
                ? 'bg-amber-500 text-bis-950 shadow-md font-extrabold'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            {t('demonstration.productFlowTab')}
          </button>
          <button
            onClick={() => setActiveTab('hallmarking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'hallmarking'
                ? 'bg-amber-500 text-bis-950 shadow-md font-extrabold'
                : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
            }`}
          >
            {t('demonstration.hallmarkingFlowTab')}
          </button>
        </div>
      </div>

      {/* Edit Modal / Inline Drawer */}
      {editingNodeId && (
        <div className="p-6 rounded-3xl bg-white border-2 border-bis-600 shadow-xl space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-bis-700" />
              <span>Edit Milestone Node: Step {editForm.stepNumber}</span>
            </h3>
            <button
              onClick={() => setEditingNodeId(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Step Title</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Category Subtitle</label>
              <input
                type="text"
                value={editForm.subtitle || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, subtitle: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Estimated Timeline</label>
              <input
                type="text"
                value={editForm.timeline || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, timeline: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Key Statutory Action</label>
              <input
                type="text"
                value={editForm.action || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, action: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-bold text-slate-700">Process Description</label>
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setEditingNodeId(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-5 py-2.5 rounded-xl bg-bis-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Flowchart Nodes */}
      <div className="space-y-4">
        {currentNodes.map((node, idx) => (
          <div key={node.id} className="relative">
            {/* Step Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm hover:border-bis-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
              <div className="flex items-start gap-4">
                {/* Number Badge */}
                <div className="w-10 h-10 rounded-2xl bg-bis-900 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {node.stepNumber}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-bis-700 bg-bis-50 border border-bis-200 rounded">
                      {node.subtitle}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-600 bg-slate-100 rounded">
                      ? {node.timeline}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {node.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {node.description}
                  </p>

                  <div className="text-xs font-semibold text-bis-800 flex items-center gap-1.5 pt-1">
                    <span className="text-amber-500 font-bold">? Key Action:</span>
                    <span>{node.action}</span>
                  </div>
                </div>
              </div>

              {/* Node Action Toolbar */}
              <div className="flex items-center gap-1.5 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    idx === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === currentNodes.length - 1}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    idx === currentNodes.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleStartEdit(node)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-bis-50 hover:text-bis-900 transition-colors"
                  title="Edit Node"
                >
                  <Edit3 className="w-4 h-4 text-bis-700" />
                </button>

                <button
                  onClick={() => handleDelete(node.id)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  title="Delete Step"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connecting Arrow */}
            {idx < currentNodes.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
