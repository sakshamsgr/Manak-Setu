import React, { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Building, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { BISLab } from '../../types/standards';

interface LabDirectoryViewProps {
  onConsultLab?: (prompt: string) => void;
}

const BIS_LABS_DATA: BISLab[] = [
  {
    id: 'cl-sahibabad',
    name: 'BIS Central Laboratory (CL Sahibabad)',
    type: 'Central Laboratory',
    city: 'Ghaziabad / Delhi NCR',
    state: 'Uttar Pradesh',
    address: 'Plot No. 20/9, Site IV, Sahibabad Industrial Area, Ghaziabad - 201010',
    contactEmail: 'cl@bis.gov.in',
    phone: '+91-120-4177100',
    disciplines: ['Chemical', 'Electrical', 'Mechanical', 'Microbiological', 'Civil'],
    accreditation: 'NABL Accredited & BIS Apex Reference Laboratory',
  },
  {
    id: 'wrol-mumbai',
    name: 'Western Regional Office Laboratory (WROL)',
    type: 'Regional Laboratory',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Manakalaya, E9, MIDC, Behind Marol Telephone Exchange, Andheri (East), Mumbai - 400093',
    contactEmail: 'wrol@bis.gov.in',
    phone: '+91-22-28329295',
    disciplines: ['Electrical', 'Chemical', 'Mechanical', 'Electronics'],
    accreditation: 'NABL ISO/IEC 17025:2017 Accredited',
  },
  {
    id: 'srol-chennai',
    name: 'Southern Regional Office Laboratory (SROL)',
    type: 'Regional Laboratory',
    city: 'Chennai',
    state: 'Tamil Nadu',
    address: 'CIT Campus, IV Cross Road, Taramani, Chennai - 600113',
    contactEmail: 'srol@bis.gov.in',
    phone: '+91-44-22541442',
    disciplines: ['Electrical', 'Chemical', 'Civil & Construction', 'Microbiology'],
    accreditation: 'NABL ISO/IEC 17025:2017 Accredited',
  },
  {
    id: 'erol-kolkata',
    name: 'Eastern Regional Office Laboratory (EROL)',
    type: 'Regional Laboratory',
    city: 'Kolkata',
    state: 'West Bengal',
    address: '1/14, C.I.T. Scheme VII M, V.I.P. Road, Kankurgachi, Kolkata - 700054',
    contactEmail: 'erol@bis.gov.in',
    phone: '+91-33-23207005',
    disciplines: ['Chemical', 'Mechanical', 'Electrical', 'Metallurgy'],
    accreditation: 'NABL ISO/IEC 17025:2017 Accredited',
  },
  {
    id: 'nrol-mohali',
    name: 'Northern Regional Office Laboratory (NROL)',
    type: 'Regional Laboratory',
    city: 'Mohali / Chandigarh',
    state: 'Punjab',
    address: 'Plot No. 4-A, Sector 27-B, Madhya Marg, Chandigarh / Mohali - 160019',
    contactEmail: 'nrol@bis.gov.in',
    phone: '+91-172-2659850',
    disciplines: ['Chemical', 'Mechanical', 'Electrical', 'Food & Agro'],
    accreditation: 'NABL ISO/IEC 17025:2017 Accredited',
  },
  {
    id: 'pbol-patna',
    name: 'Patna Branch Office Laboratory (PBOL)',
    type: 'Branch Laboratory',
    city: 'Patna',
    state: 'Bihar',
    address: 'Pushpanjali, 1st Floor, Boring Patliputra Road, Patna - 800013',
    contactEmail: 'pbol@bis.gov.in',
    phone: '+91-612-2262808',
    disciplines: ['Chemical', 'Microbiology', 'Drinking Water Testing'],
    accreditation: 'BIS In-House Branch Lab',
  },
  {
    id: 'rec-shriram-delhi',
    name: 'Shriram Institute for Industrial Research (Recognized)',
    type: 'BIS Recognized Lab',
    city: 'Delhi',
    state: 'Delhi NCR',
    address: '19, University Road, Delhi - 110007',
    contactEmail: 'customercare@shriraminstitute.org',
    phone: '+91-11-27667267',
    disciplines: ['Plastics & Polymers', 'Chemical', 'Toxicology', 'Electrical Components'],
    accreditation: 'BIS LIMS Recognized & NABL Accredited',
  },
  {
    id: 'rec-tuv-bangalore',
    name: 'TÜV Rheinland India Testing Lab (Recognized)',
    type: 'BIS Recognized Lab',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Electronic City Phase 1, Hosur Road, Bengaluru - 560100',
    contactEmail: 'info@ind.tuv.com',
    phone: '+91-80-46498000',
    disciplines: ['Electronics CRS (Scheme-II)', 'Batteries', 'Solar PV Modules', 'Telecom'],
    accreditation: 'BIS MeitY/CRS Recognized Lab',
  },
];

export const LabDirectoryView: React.FC<LabDirectoryViewProps> = ({ onConsultLab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('All');

  const disciplines = ['All', 'Electrical', 'Chemical', 'Mechanical', 'Microbiological', 'Civil'];

  const filteredLabs = BIS_LABS_DATA.filter((lab) => {
    const matchesDiscipline =
      selectedDiscipline === 'All' ||
      lab.disciplines.some((d) => d.toLowerCase().includes(selectedDiscipline.toLowerCase()));

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      lab.name.toLowerCase().includes(query) ||
      lab.city.toLowerCase().includes(query) ||
      lab.state.toLowerCase().includes(query) ||
      lab.disciplines.some((d) => d.toLowerCase().includes(query));

    return matchesDiscipline && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-bis-950 via-bis-900 to-bis-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500 text-bis-950 rounded-lg">
            Laboratory Recognition & Testing Network
          </span>
          <span className="text-xs text-slate-300">LIMS Portal</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          BIS Testing Laboratories Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
          Locate BIS Central Laboratory, Regional Quality Test Houses, and LIMS-recognized commercial test facilities across India for sample conformity assessment and pre-licence testing.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by lab name, city, state, or testing discipline..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-bis-500 focus:border-bis-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {disciplines.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDiscipline(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                selectedDiscipline === d
                  ? 'bg-bis-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Lab Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLabs.map((lab) => (
          <div
            key={lab.id}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:border-bis-300 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border ${
                    lab.type === 'Central Laboratory'
                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                      : lab.type === 'Regional Laboratory'
                      ? 'bg-bis-50 text-bis-900 border-bis-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lab.type}
                </span>
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-bis-700" />
                  {lab.city}, {lab.state}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-slate-900">{lab.name}</h3>

              <p className="text-xs text-slate-600 leading-relaxed">{lab.address}</p>

              <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] font-semibold">{lab.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px] text-bis-700">{lab.contactEmail}</span>
                </div>
              </div>

              {/* Disciplines */}
              <div className="flex flex-wrap gap-1 pt-1">
                {lab.disciplines.map((disc, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded"
                  >
                    {disc}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[180px]">
                {lab.accreditation}
              </span>

              {onConsultLab && (
                <button
                  onClick={() =>
                    onConsultLab(
                      `What products and standard tests are handled by ${lab.name} in ${lab.city}? What is the sample submission protocol and fee structure?`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-bis-50 hover:bg-bis-100 text-bis-900 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Inquire with AI</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
