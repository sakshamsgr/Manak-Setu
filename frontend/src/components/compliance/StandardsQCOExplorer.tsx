import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Award,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';
import { IndianStandard } from '../../types/standards';
import { Modal } from '../common/Modal';

interface StandardsQCOExplorerProps {
  onConsultStandard?: (prompt: string) => void;
}

const INDIAN_STANDARDS_CATALOG: IndianStandard[] = [
  {
    id: 'is-302-1',
    code: 'IS 302 (Part 1): 2008 / IS 302-2-3',
    title: 'Safety of Household and Similar Electrical Appliances (Electric Kettles, Irons, Geysers)',
    category: 'Electrical & Electronics',
    year: '2008 (Reaffirmed 2023)',
    status: 'Mandatory QCO',
    scope: 'Deals with safety of electrical appliances for household and similar purposes, rated voltage up to 250 V single-phase.',
    productKeywords: ['Electric Kettle', 'Geyser', 'Toaster', 'Electric Iron', 'Mixer Grinder', 'Immersion Heater'],
    keyTests: ['High Voltage Dielectric Strength (1000V+)', 'Earth Continuity Test (< 0.1 Ohm)', 'Leakage Current Measurement', 'Temperature Rise at Terminals', 'Resistance to Heat & Fire'],
  },
  {
    id: 'is-10500',
    code: 'IS 10500: 2012',
    title: 'Drinking Water Specification (Second Revision)',
    category: 'Food & Agriculture',
    year: '2012 (Reaffirmed 2021)',
    status: 'Mandatory QCO',
    scope: 'Prescribes quality requirements and permissible limits for water intended for human consumption and packaged water.',
    productKeywords: ['Packaged Drinking Water', 'RO Water Purifiers', 'Mineral Water', 'Bulk Water Jars'],
    keyTests: ['pH Value (6.5 to 8.5)', 'Total Dissolved Solids (TDS < 500 mg/L)', 'Total Hardness (CaCO3)', 'Heavy Metals (Lead, Arsenic, Cadmium)', 'E. coli and Coliform Detection'],
  },
  {
    id: 'is-1293',
    code: 'IS 1293: 2019',
    title: 'Plugs and Socket-Outlets for Rated Voltages up to 250 V and Currents up to 16 A',
    category: 'Electrical & Electronics',
    year: '2019 (Third Revision)',
    status: 'Mandatory QCO',
    scope: 'Applies to plugs, fixed or portable socket-outlets, multiway adaptors, and extension cords.',
    productKeywords: ['3-Pin Plug', 'Wall Socket', 'Extension Board', 'Power Strip', 'Appliance Cordset'],
    keyTests: ['Dimensions & Gauge Verification', 'Temperature Rise at Terminals', 'Making and Breaking Capacity', 'Mechanical Strength & Impact', 'Glow Wire Fire Resistance (850°C)'],
  },
  {
    id: 'is-694',
    code: 'IS 694: 2010',
    title: 'PVC Insulated Cables for Working Voltages up to and including 1100 V',
    category: 'Electrical & Electronics',
    year: '2010 (Reaffirmed 2022)',
    status: 'Mandatory QCO',
    scope: 'Specifies single and multi-core PVC insulated and sheathed power/control building cables.',
    productKeywords: ['House Wire', 'PVC Cable', 'Flexible Copper Cord', 'Submersible Cable'],
    keyTests: ['Conductor Resistance (Ohm/km)', 'Insulation Thickness & Eccentricity', 'Tensile Strength and Elongation', 'Flame Retardance (Oxygen Index)', 'Thermal Stability Test'],
  },
  {
    id: 'is-1489-1',
    code: 'IS 1489 (Part 1): 2015',
    title: 'Portland Pozzolana Cement - Specification (Fly Ash Based)',
    category: 'Civil Engineering',
    year: '2015 (Fourth Revision)',
    status: 'Mandatory QCO',
    scope: 'Covers manufacture and chemical/physical requirements of fly ash based PPC cement.',
    productKeywords: ['PPC Cement', 'Building Concrete', 'Structural Mortar'],
    keyTests: ['Compressive Strength (3, 7 & 28 Days)', 'Fineness (Blaine Air Permeability)', 'Initial and Final Setting Time', 'Soundness (Le-Chatelier & Autoclave)', 'Insoluble Residue Test'],
  },
  {
    id: 'is-16046-2',
    code: 'IS 16046 (Part 2): 2018 / IEC 62133-2',
    title: 'Secondary Cells and Batteries (Lithium Systems) for Portable Applications',
    category: 'Electrical & Electronics',
    year: '2018 (Compulsory CRS)',
    status: 'Mandatory QCO',
    scope: 'Safety requirements for portable sealed secondary lithium cells and battery packs.',
    productKeywords: ['Lithium-ion Battery', 'Power Bank', 'Laptop Battery Pack', 'EV Battery Modules'],
    keyTests: ['Continuous Charging Under Temperature', 'External Short Circuit Test', 'Free Fall & Mechanical Shock', 'Thermal Abuse (130°C Oven)', 'Overcharge & Forced Discharge'],
  },
  {
    id: 'is-9873-1',
    code: 'IS 9873 (Part 1): 2019',
    title: 'Safety of Toys - Mechanical and Physical Properties',
    category: 'Mechanical',
    year: '2019 (Toys QCO 2020)',
    status: 'Mandatory QCO',
    scope: 'Structural and physical safety criteria for children toys to eliminate ingestion and choking hazards.',
    productKeywords: ['Plastic Toys', 'Stuffed Dolls', 'Rattles', 'Educational Toys', 'Ride-on Toys'],
    keyTests: ['Small Parts Cylinder Test', 'Sharp Points & Sharp Edges', 'Tension and Torque Pull Test', 'Drop and Impact Test', 'Flammability Test (Part 2)'],
  },
  {
    id: 'is-15652',
    code: 'IS 15652: 2006',
    title: 'Insulating Mats for Electrical Purposes',
    category: 'Electrical & Electronics',
    year: '2006 (Reaffirmed 2021)',
    status: 'Active',
    scope: 'Elastomeric floor covering mats used for electrical insulation protection up to 33 kV.',
    productKeywords: ['Insulating Rubber Mat', 'Substation Flooring', 'Switchboard Safety Mat'],
    keyTests: ['Dielectric Strength Test', 'Insulation Resistance with Water Electrode', 'Tensile Strength & Elongation at Break', 'Flammability Resistance', 'Low Temperature Resistance'],
  },
];

export const StandardsQCOExplorer: React.FC<StandardsQCOExplorerProps> = ({ onConsultStandard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStandard, setSelectedStandard] = useState<IndianStandard | null>(null);

  const categories = ['All', 'Electrical & Electronics', 'Food & Agriculture', 'Civil Engineering', 'Mechanical'];

  const filteredStandards = INDIAN_STANDARDS_CATALOG.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.code.toLowerCase().includes(query) ||
      item.title.toLowerCase().includes(query) ||
      item.scope.toLowerCase().includes(query) ||
      item.productKeywords.some((k) => k.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
            National Standards Repository
          </span>
          <span className="text-xs text-slate-300">BIS Act 2016</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          Indian Standards (IS) & Quality Control Orders (QCO)
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Search authorized Indian Standard specifications, determine whether your product falls under a mandatory Gazette Quality Control Order (QCO), and view mandatory laboratory testing benchmarks.
        </p>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by IS code (e.g. IS 302, IS 10500, IS 1293), product (kettle, water, wire, toys), or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-bis-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Standards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredStandards.map((std) => (
          <div
            key={std.id}
            onClick={() => setSelectedStandard(std)}
            className="group bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 hover:border-bis-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 text-xs font-mono font-extrabold bg-bis-100 text-bis-900 rounded-lg border border-bis-200">
                  {std.code}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                    std.status === 'Mandatory QCO'
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {std.status}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-bis-800 transition-colors line-clamp-2">
                {std.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {std.scope}
              </p>

              {/* Product Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {std.productKeywords.slice(0, 3).map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded"
                  >
                    {kw}
                  </span>
                ))}
                {std.productKeywords.length > 3 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{std.productKeywords.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-bis-700">
              <span>View Conformity Tests & Scope</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Standard Detail Modal */}
      <Modal
        isOpen={!!selectedStandard}
        onClose={() => setSelectedStandard(null)}
        title={
          <div className="flex items-center gap-2 text-bis-900">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>{selectedStandard?.code}</span>
          </div>
        }
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setSelectedStandard(null)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            {onConsultStandard && selectedStandard && (
              <button
                onClick={() => {
                  const prompt = `What are the mandatory quality control requirements, test procedures, and licensing guidelines for ${selectedStandard.code} (${selectedStandard.title})?`;
                  setSelectedStandard(null);
                  onConsultStandard(prompt);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-bis-800 hover:bg-bis-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Consult AI on this Standard</span>
              </button>
            )}
          </>
        }
      >
        {selectedStandard && (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">{selectedStandard.title}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Category: {selectedStandard.category}</span>
                <span>•</span>
                <span>Year: {selectedStandard.year}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Standard Scope & Applicability:
              </div>
              <p className="text-slate-700 leading-relaxed">{selectedStandard.scope}</p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Mandatory Laboratory Quality & Safety Tests:
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedStandard.keyTests.map((t, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-bis-50 border border-bis-100 text-bis-900 text-xs flex items-start gap-2 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-bis-600 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Target Products:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStandard.productKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
