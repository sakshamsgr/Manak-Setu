import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle, 
  ExternalLink, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { IndianStandard } from '../../types/standards';
import { Modal } from '../common/Modal';

interface StandardsLibraryProps {
  onAskAIAboutStandard?: (prompt: string) => void;
}

const INDIAN_STANDARDS_CATALOG: IndianStandard[] = [
  {
    id: 'is-302-1',
    code: 'IS 302 (Part 1): 2008',
    title: 'Safety of Household and Similar Electrical Appliances - General Requirements',
    category: 'Electrical & Electronics',
    year: '2008 (Reaffirmed 2023)',
    status: 'Mandatory QCO',
    scope: 'Deals with the safety of electrical appliances for household and similar purposes, their rated voltage being not more than 250 V for single-phase appliances and 480 V for other appliances.',
    productKeywords: ['Geyser', 'Toaster', 'Iron', 'Mixer Grinder', 'Electric Kettle', 'Heater'],
    keyTests: ['High Voltage Dielectric Test', 'Earth Continuity Test', 'Leakage Current Measurement', 'Temperature Rise Test', 'Insulation Resistance Test'],
  },
  {
    id: 'is-10500',
    code: 'IS 10500: 2012',
    title: 'Drinking Water - Specification (Second Revision)',
    category: 'Food & Agriculture',
    year: '2012 (Reaffirmed 2021)',
    status: 'Mandatory QCO',
    scope: 'Prescribes the quality requirements and permissible limits for water intended for human consumption, packaged drinking water, and municipal water supplies.',
    productKeywords: ['Drinking Water', 'RO Purifier', 'Packaged Natural Mineral Water', 'Water Filtration'],
    keyTests: ['pH Value (6.5 to 8.5)', 'Total Dissolved Solids (TDS < 500 mg/L)', 'Total Hardness (CaCO3)', 'Heavy Metals (Lead, Arsenic, Cadmium)', 'E. coli and Coliform Detection'],
  },
  {
    id: 'is-1293',
    code: 'IS 1293: 2019',
    title: 'Plugs and Socket-Outlets for Rated Voltages up to and including 250 V and Rated Currents up to and including 16 A',
    category: 'Electrical & Electronics',
    year: '2019 (Third Revision)',
    status: 'Mandatory QCO',
    scope: 'Applies to plugs and fixed or portable socket-outlets for a.c. only, with or without earthing contact, for domestic and similar purposes.',
    productKeywords: ['Plug', 'Socket', 'Power Strip', 'Extension Board', 'Wall Switch Socket'],
    keyTests: ['Dimensions & Gauge Verification', 'Temperature Rise at Terminals', 'Making and Breaking Capacity', 'Mechanical Strength & Impact', 'Resistance to Heat and Fire (Glow Wire)'],
  },
  {
    id: 'is-694',
    code: 'IS 694: 2010',
    title: 'Polyvinyl Chloride (PVC) Insulated Unsheathed and Sheathed Cables/Cords with Rigid and Flexible Conductor',
    category: 'Electrical & Electronics',
    year: '2010 (Reaffirmed 2022)',
    status: 'Mandatory QCO',
    scope: 'Specifies requirements for single and multi-core PVC insulated and sheathed/unsheathed power and control cables for voltages up to 1100 V.',
    productKeywords: ['House Wire', 'PVC Cable', 'Flexible Cord', 'Copper Wire', 'Submersible Cable'],
    keyTests: ['Conductor Resistance Test', 'Insulation Thickness & Eccentricity', 'Tensile Strength and Elongation', 'Flame Retardance Test (Oxygen Index)', 'Thermal Stability of Insulation'],
  },
  {
    id: 'is-1489-1',
    code: 'IS 1489 (Part 1): 2015',
    title: 'Portland Pozzolana Cement - Specification (Fly Ash Based)',
    category: 'Civil Engineering',
    year: '2015 (Fourth Revision)',
    status: 'Mandatory QCO',
    scope: 'Covers manufacture, chemical and physical requirements of fly ash based Portland Pozzolana Cement for structural and construction uses.',
    productKeywords: ['Cement', 'PPC Cement', 'Construction Material', 'Mortar', 'Concrete'],
    keyTests: ['Compressive Strength (3, 7 & 28 Days)', 'Fineness (Blaine Air Permeability)', 'Initial and Final Setting Time', 'Soundness (Le-Chatelier & Autoclave)', 'Insoluble Residue Test'],
  },
  {
    id: 'is-15652',
    code: 'IS 15652: 2006',
    title: 'Insulating Mats for Electrical Purposes',
    category: 'Electrical & Electronics',
    year: '2006 (Reaffirmed 2021)',
    status: 'Active',
    scope: 'Prescribes requirements for elastomeric insulating mats used as a floor covering for the protection of workers on AC and DC electrical installations up to 33 kV.',
    productKeywords: ['Rubber Mat', 'Electrical Insulating Mat', 'Substation Flooring', 'Switchboard Mat'],
    keyTests: ['Dielectric Strength Test', 'Insulation Resistance with Water Electrode', 'Tensile Strength & Elongation at Break', 'Flammability Resistance', 'Low Temperature Resistance'],
  },
  {
    id: 'is-9873-1',
    code: 'IS 9873 (Part 1): 2019',
    title: 'Safety of Toys - Mechanical and Physical Properties',
    category: 'Mechanical',
    year: '2019 (Mandatory under Toys QCO 2020)',
    status: 'Mandatory QCO',
    scope: 'Specifies acceptable criteria for the structural characteristics of toys, such as shape, size, contour, spacing, and hazards from sharp points and edges.',
    productKeywords: ['Plastic Toys', 'Stuffed Animals', 'Baby Rattle', 'Ride-on Toys', 'Puzzles'],
    keyTests: ['Small Parts Cylinder Ingestion Test', 'Sharp Points and Sharp Edges Test', 'Tension and Torque Test', 'Drop and Impact Test', 'Flammability Test (Part 2)'],
  },
  {
    id: 'is-16046-2',
    code: 'IS 16046 (Part 2): 2018 / IEC 62133-2',
    title: 'Secondary Cells and Batteries Containing Alkaline or Other Non-Acid Electrolytes (Lithium Systems)',
    category: 'Electrical & Electronics',
    year: '2018 (Compulsory CRS)',
    status: 'Mandatory QCO',
    scope: 'Specifies requirements and tests for the safe operation of portable sealed secondary lithium cells and batteries used in electronic devices.',
    productKeywords: ['Lithium-ion Battery', 'Power Bank', 'EV Battery Pack', 'Laptop Battery', 'Mobile Phone Battery'],
    keyTests: ['Continuous Charging Under Low/High Temperature', 'External Short Circuit Test', 'Free Fall & Mechanical Shock', 'Thermal Abuse (130°C Oven)', 'Overcharge & Forced Discharge'],
  },
];

export const StandardsLibrary: React.FC<StandardsLibraryProps> = ({ onAskAIAboutStandard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-bis-900 to-bis-950 rounded-2xl p-6 text-white shadow-lg border border-bis-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                Repository of Authorized Indian Standards
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white">
                Indian Standards (IS) Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-0.5">
                Explore key BIS specifications, Quality Control Orders (QCO), mandatory testing benchmarks, and compliance scope.
              </p>
            </div>
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 shrink-0 hidden sm:block">
              <BookOpen className="w-8 h-8 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-200 p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by IS code (e.g. IS 302, IS 10500), product (water, cable, toys), or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-sm text-slate-900 focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all shadow-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-bis-800 text-white shadow-xs'
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
              className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-bis-300 shadow-card hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-bis-100 text-bis-900 rounded-md border border-bis-200">
                    {std.code}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                      std.status === 'Mandatory QCO'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {std.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-bis-800 transition-colors line-clamp-2">
                  {std.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {std.scope}
                </p>

                {/* Keywords */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {std.productKeywords.slice(0, 3).map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 rounded"
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

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-bis-700">
                <span>View Mandatory Tests & Scope</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {filteredStandards.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="font-bold text-slate-700">No standards found matching your search.</div>
            <p className="text-xs text-slate-500">
              Try searching with another query or ask the AI Assistant directly.
            </p>
          </div>
        )}
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
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            {onAskAIAboutStandard && selectedStandard && (
              <button
                onClick={() => {
                  const prompt = `What are the mandatory quality control requirements, test procedures, and licensing guidelines for ${selectedStandard.code} (${selectedStandard.title})?`;
                  setSelectedStandard(null);
                  onAskAIAboutStandard(prompt);
                }}
                className="px-4 py-1.5 text-xs font-bold bg-bis-700 hover:bg-bis-600 active:bg-bis-800 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow"
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

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Standard Scope & Applicability:
              </div>
              <p className="text-slate-700 leading-relaxed">{selectedStandard.scope}</p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Key Laboratory Quality & Safety Tests:
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedStandard.keyTests.map((t, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-bis-50 border border-bis-100 text-bis-900 text-xs flex items-start gap-2 font-medium"
                  >
                    <CheckCircle className="w-4 h-4 text-bis-600 shrink-0 mt-0.5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Target Products & Industries:
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
