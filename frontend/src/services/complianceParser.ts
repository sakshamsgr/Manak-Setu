import { 
  ProductCertificationGuideData, 
  ProductProfile, 
  StandardDetails, 
  CertificationDetails, 
  TestingDetails, 
  DocumentItem, 
  ApplicationMilestone,
  ComplianceApplicability,
  SchemeCategory
} from '../types/compliance';
import { Citation } from '../types/chat';

/**
 * Known mapping of common products to Indian Standards for high-precision extraction
 */
const KNOWN_STANDARDS_DB: Record<string, { 
  code: string; 
  title: string; 
  category: string;
  scope: string;
  whyItApplies: string;
  relatedStandards: string[];
  qco: boolean; 
  scheme: SchemeCategory;
  tests: Array<{ name: string; type: 'Routine Test' | 'Type Test' | 'Acceptance Test'; description: string }>;
}> = {
  kettle: { 
    code: 'IS 302-2-3 / IS 302 (Part 1)', 
    title: 'Safety of Household Electric Kettles and Similar Appliances', 
    category: 'Electrical & Electronics',
    scope: 'Prescribes safety and construction requirements for electric kettles, jugs, and water heating appliances with rated voltages up to 250 V.',
    whyItApplies: 'Covers electric water boiling appliances with enclosed elements against electric shock, moisture ingress, thermal runaway, and fire hazards.',
    relatedStandards: ['IS 302 (Part 1): 2008 (General Safety)', 'IS 1293: 2019 (Plug & Socket)', 'IS 694: 2010 (Supply Cord)'],
    qco: true, 
    scheme: 'Scheme-I (ISI Mark)',
    tests: [
      { name: 'High Voltage Dielectric Strength Test', type: 'Routine Test', description: 'Application of 1000V AC between live parts and accessible metallic enclosure for 1 minute.' },
      { name: 'Earth Continuity Test', type: 'Routine Test', description: 'Verification that resistance between earthing terminal and accessible metal parts does not exceed 0.1 Ohm.' },
      { name: 'Leakage Current Measurement at Operating Temp', type: 'Type Test', description: 'Continuous measurement ensuring leakage current is below 0.75 mA under full thermal load.' },
      { name: 'Dry Boil Protection & Thermal Cutout', type: 'Type Test', description: 'Endurance test of automatic bimetal/thermal switch to prevent fire when operated without water.' },
      { name: 'Moisture Resistance & Spill Test', type: 'Acceptance Test', description: '15% overfill test ensuring water spillage does not impair electrical insulation.' },
    ]
  },
  water: { 
    code: 'IS 10500: 2012 / IS 14543', 
    title: 'Drinking Water & Packaged Natural Mineral Water Specification', 
    category: 'Food & Agriculture',
    scope: 'Prescribes statutory permissible limits for physical, chemical, toxic substance, and microbiological parameters for water intended for human consumption.',
    whyItApplies: 'Mandatory statutory specification ensuring potability, absence of heavy metal contamination, and complete microbial safety.',
    relatedStandards: ['IS 14543: 2016 (Packaged Drinking Water)', 'IS 13428 (Packaged Mineral Water)', 'IS 3025 (Methods of Water Sampling & Testing)'],
    qco: true, 
    scheme: 'Scheme-I (ISI Mark)',
    tests: [
      { name: 'pH Value & Total Dissolved Solids (TDS)', type: 'Routine Test', description: 'pH test (permissible 6.5 to 8.5) and TDS limit measurement (< 500 mg/L).' },
      { name: 'Total Hardness & Chloride Content', type: 'Routine Test', description: 'Titration testing ensuring total hardness as CaCO3 does not exceed 200 mg/L.' },
      { name: 'Heavy Metals Spectrophotometry (Lead, Arsenic, Cadmium)', type: 'Type Test', description: 'Atomic absorption testing ensuring zero toxic metal residues.' },
      { name: 'Microbiological Analysis (E. coli, Coliform, Pseudomonas)', type: 'Routine Test', description: 'Membrane filtration testing ensuring zero colonies per 250 ml sample.' },
      { name: 'Pesticide Residue Analysis (GC-MS/MS)', type: 'Type Test', description: 'Individual pesticide residue testing ensuring limits below 0.0001 mg/L.' },
    ]
  },
  cable: { 
    code: 'IS 694: 2010', 
    title: 'PVC Insulated Cables for Working Voltages up to and including 1100 V', 
    category: 'Electrical & Electronics',
    scope: 'Covers single and multi-core PVC insulated and sheathed power/control building copper and aluminium wires.',
    whyItApplies: 'Mandatory standard for building wiring, industrial wiring, and domestic appliance cables preventing electrical short-circuit fires.',
    relatedStandards: ['IS 8130 (Conductors for Insulated Electric Cables)', 'IS 5831 (PVC Insulation and Sheath of Electric Cables)', 'IS 10810 (Methods of Test for Cables)'],
    qco: true, 
    scheme: 'Scheme-I (ISI Mark)',
    tests: [
      { name: 'Conductor Resistance Test (Ohm/km at 20°C)', type: 'Routine Test', description: 'Precision Kelvin Bridge measurement of copper/aluminium conductor electrical resistance.' },
      { name: 'Insulation Thickness & Eccentricity', type: 'Routine Test', description: 'Optical projector measurement ensuring minimum radial insulation thickness meets standard.' },
      { name: 'High Voltage Water Immersion Test (3 kV AC)', type: 'Routine Test', description: 'Application of 3000 V AC spark testing for 5 minutes in water tank.' },
      { name: 'Tensile Strength & Elongation at Break of PVC', type: 'Type Test', description: 'Mechanical tensile pulling test before and after accelerated thermal oven aging.' },
      { name: 'Flame Retardance & Oxygen Index Test', type: 'Type Test', description: 'Verification of critical oxygen index (> 29%) for fire-retardant (FR/FRLS) insulation.' },
    ]
  },
  plug: { 
    code: 'IS 1293: 2019', 
    title: 'Plugs and Socket-Outlets for Rated Voltages up to 250 V and Currents up to 16 A', 
    category: 'Electrical & Electronics',
    scope: 'Applies to plugs, fixed/portable socket-outlets, multiway adaptors, and appliance extension cords.',
    whyItApplies: 'Mandatory safety regulation preventing loose contact sparks, dangerous contact pin insertion, and overheating.',
    relatedStandards: ['IS 302 (Part 1) (Safety Requirements)', 'IS 694 (Supply Cord)', 'IS 3854 (Switches for Domestic Purposes)'],
    qco: true, 
    scheme: 'Scheme-I (ISI Mark)',
    tests: [
      { name: 'Pin Dimensions & Go/No-Go Gauge Verification', type: 'Routine Test', description: 'Dimensional inspection with precision hardened steel gauges for 6A and 16A configurations.' },
      { name: 'Temperature Rise at Terminals Under Full Load', type: 'Type Test', description: 'Thermocouple measurement ensuring terminal temperature rise does not exceed 45°C under 1.1x rated current.' },
      { name: 'Making & Breaking Capacity / Endurance Test', type: 'Type Test', description: '10,000 continuous insertions under electrical load at 30 strokes per minute.' },
      { name: 'Glow Wire Fire Resistance Test (850°C)', type: 'Type Test', description: 'Application of incandescent 850°C glow-wire loop on thermoplastic housing to verify self-extinguishing.' },
      { name: 'Cord Anchorage Pull and Torsion Test', type: 'Acceptance Test', description: '100 pulls of 60 N force followed by 0.25 Nm torsion to verify mechanical clamping.' },
    ]
  },
  battery: { 
    code: 'IS 16046 (Part 2): 2018 / IEC 62133-2', 
    title: 'Secondary Cells and Batteries (Lithium Systems) for Portable Applications', 
    category: 'Electrical & Electronics',
    scope: 'Specifies safety requirements and compliance tests for portable sealed secondary lithium cells and battery packs.',
    whyItApplies: 'Compulsory Registration Scheme (CRS) requirement to prevent thermal runaway, fire, explosion, or chemical leakage.',
    relatedStandards: ['IS 16046 (Part 1) (Nickel Systems)', 'IS 16047 (Secondary Lithium Cells for Electric Vehicles)'],
    qco: true, 
    scheme: 'Scheme-II (CRS Self-Declaration)',
    tests: [
      { name: 'External Short Circuit Test at 55°C', type: 'Type Test', description: 'Direct short circuit with < 80 mOhm resistance at 55°C until temperature stabilizes.' },
      { name: 'Thermal Abuse (130°C Oven Test)', type: 'Type Test', description: 'Exposure to 130°C chamber for 10 minutes to verify no explosion or fire.' },
      { name: 'Free Fall & Mechanical Shock Test', type: 'Acceptance Test', description: 'Repeated drops from 1 meter height onto concrete surface in 6 orientations.' },
      { name: 'Overcharge Under Fault Conditions', type: 'Type Test', description: 'Continuous 2x charging current with failed BMS to ensure explosion protection.' },
    ]
  },
  iron: {
    code: 'IS 302-2-3 / IS 366: 1991',
    title: 'Electric Irons (Dry & Steam) - Safety & Performance Specification',
    category: 'Electrical & Electronics',
    scope: 'Safety and performance requirements for domestic electric dry irons and steam irons with temperature regulators.',
    whyItApplies: 'Mandatory standard governing soleplate temperature controls, earthing continuity, steam pressure vessel safety, and cord flexure.',
    relatedStandards: ['IS 302 (Part 1): 2008 (General Electrical Safety)', 'IS 1293 (Molded Plug)', 'IS 694 (Heat-Resistant Cord)'],
    qco: true,
    scheme: 'Scheme-I (ISI Mark)',
    tests: [
      { name: 'High Voltage Dielectric Test (1250V AC)', type: 'Routine Test', description: 'Application of 1250 V AC for 1 minute between heater element and soleplate.' },
      { name: 'Earth Continuity Test (< 0.1 Ohm)', type: 'Routine Test', description: 'Verification of robust earthing between grounding pin and soleplate casting.' },
      { name: 'Thermostat Temperature Regulation & Overshoot', type: 'Type Test', description: 'Measurement of soleplate surface temperature at settings 1, 2, 3 ensuring limits are not exceeded.' },
      { name: 'Cord Flexing Endurance (20,000 oscillations)', type: 'Type Test', description: 'Continuous mechanical flexing of swivel cord entry under electrical current load.' },
    ]
  }
};

function extractProductName(query: string): string {
  const q = query.toLowerCase();
  for (const key of Object.keys(KNOWN_STANDARDS_DB)) {
    if (q.includes(key)) {
      if (key === 'iron') return 'Electric Iron (Dry & Steam)';
      if (key === 'kettle') return 'Electric Kettle & Water Heater';
      if (key === 'water') return 'Packaged Drinking Water';
      if (key === 'cable') return 'PVC Insulated Cables & Wires';
      if (key === 'plug') return 'Plugs & Socket-Outlets';
      if (key === 'battery') return 'Lithium-ion Battery Pack';
    }
  }

  const match = query.match(/(?:manufacture|produce|import|make|selling|standard for|testing for)\s+([a-zA-Z0-9\s-]{3,28})/i);
  if (match && match[1]) {
    const raw = match[1].replace(/(what|how|which|in|under|according|is|are|the|a|an).*$/i, '').trim();
    if (raw.length > 2) {
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
  }
  return 'Product Under Consultation';
}

export function generateProductCertificationGuideData(
  query: string,
  replyText: string,
  citations: Citation[],
  attachmentName?: string
): ProductCertificationGuideData {
  const productName = extractProductName(query);
  const q = query.toLowerCase();

  // Find standard in DB or fallback
  let matchedEntry = Object.entries(KNOWN_STANDARDS_DB).find(([k]) => q.includes(k))?.[1];

  let standardCode = matchedEntry?.code || 'IS 302 (Part 1)';
  let standardTitle = matchedEntry?.title || `Indian Standard Specification for ${productName}`;
  let category = matchedEntry?.category || 'Electrical & Electronics';
  let scope = matchedEntry?.scope || `Specifies mandatory construction, safety, and testing requirements for ${productName}.`;
  let whyItApplies = matchedEntry?.whyItApplies || `Establishes minimum benchmark safety and quality parameters under the BIS Act 2016 for ${productName}.`;
  let relatedStandards = matchedEntry?.relatedStandards || ['IS 302 (Part 1): General Safety Requirements', 'IS 1293: Plugs and Socket Outlets'];
  let scheme: SchemeCategory = matchedEntry?.scheme || 'Scheme-I (ISI Mark)';
  let isMandatory = matchedEntry?.qco ?? true;
  let applicability: ComplianceApplicability = isMandatory ? 'Mandatory (QCO Notified)' : 'Voluntary Certification';

  // Override from citations if present
  if (citations && citations.length > 0) {
    const docName = citations[0].document || citations[0].standard_id;
    if (docName && docName.toUpperCase().includes('IS')) {
      standardCode = docName;
      standardTitle = `Indian Standard Specification (${docName})`;
    }
  }

  const productProfile: ProductProfile = {
    name: productName,
    category,
    industryScale: 'micro',
    isForeign: false,
    manufacturingLocation: 'India (Domestic Facility)',
    modelVarieties: 'Standard Domestic Models',
  };

  const standardDetails: StandardDetails = {
    code: standardCode,
    title: standardTitle,
    whyItApplies,
    scope,
    relatedStandards,
    officialSource: `Bureau of Indian Standards (${standardCode})`,
    officialUrl: `https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails?is_no=${encodeURIComponent(standardCode.replace(/[^a-zA-Z0-9]/g, ''))}`,
  };

  const certificationDetails: CertificationDetails = {
    isMandatory,
    applicability,
    scheme,
    qcoNotification: isMandatory 
      ? 'Quality Control Order (QCO) issued by Ministry of Consumer Affairs / DPIIT under Section 16 of the BIS Act 2016.'
      : 'Voluntary third-party product quality certification under Scheme-I.',
    keyConditions: [
      'Manufacturing premises must be equipped with in-house laboratory apparatus as prescribed in Scheme of Inspection and Testing (SIT).',
      'Qualified technical quality control personnel must be appointed on a full-time basis.',
      'Mandatory pre-licence factory inspection by BIS technical officer and testing of drawn counter-samples.',
      'Affixation of standard mark with unique CM/L licence number on all finished retail packaging.',
    ],
    exemptions: [
      'Micro enterprises holding valid Udyam certificates receive a 50% statutory fee concession.',
      'DPIIT recognized startups receive 50% concession on application and minimum annual marking fees.',
      'Small enterprises receive a 20% statutory concession on application and marking fees.',
    ],
  };

  const testingDetails: TestingDetails = {
    requiredTests: matchedEntry?.tests || [
      { name: 'High Voltage Dielectric Strength Test', type: 'Routine Test', description: 'Application of high voltage AC between live conductors and metal chassis for 1 minute.' },
      { name: 'Earth Continuity & Resistance Test', type: 'Routine Test', description: 'Measurement of resistance between earthing pin and exposed chassis (< 0.1 Ohm).' },
      { name: 'Insulation Resistance Test', type: 'Routine Test', description: '500V DC megger test ensuring minimum insulation resistance exceeds 2 Megaohms.' },
      { name: 'Endurance & Temperature Rise Test', type: 'Type Test', description: 'Continuous thermal run at rated voltage to verify temperature stability of terminals and winding.' },
    ],
    labInfo: 'Testing must be conducted at the in-house factory laboratory for routine tests, and at BIS Apex Central Laboratory (Sahibabad) or BIS-recognized NABL testing laboratory for pre-licence counter-samples.',
    samplingProtocol: '1 sample set for in-house testing + 2 independent counter-sample sets drawn by BIS inspecting officer during factory audit.',
  };

  const documentChecklist: DocumentItem[] = [
    { id: 'doc_1', title: 'Factory Premises Proof & Municipal Trade Licence', category: 'Legal', description: 'Registered lease deed or ownership document of manufacturing premises along with factory licence.', required: true },
    { id: 'doc_2', title: 'Udyam Registration Certificate (MSME Concession)', category: 'Legal', description: 'Valid Udyam Certificate to claim 50% (Micro) or 20% (Small) statutory fee reduction.', required: true },
    { id: 'doc_3', title: 'Manufacturing Machinery & Equipment List', category: 'Technical', description: 'Complete inventory of production machinery, production capacity, and manufacturing process flowchart.', required: true },
    { id: 'doc_4', title: 'In-House Testing Equipment & Valid Calibration Certificates', category: 'Testing', description: 'Complete list of testing apparatus specified in Scheme of Inspection and Testing (SIT) with valid calibration certificates from NABL lab.', required: true },
    { id: 'doc_5', title: 'Raw Material Test Certificates (MTC) & Supplier Qualification', category: 'Quality Control', description: 'Test certificates for all critical raw materials, polymers, conductors, and switches.', required: true },
    { id: 'doc_6', title: 'Appointment of Qualified Technical Quality Control Staff', category: 'Quality Control', description: 'Degrees, qualification certificates, and appointment letters of full-time QC laboratory chemists/engineers.', required: true },
    { id: 'doc_7', title: 'Factory Layout Drawing & Test Room Setup Plan', category: 'Technical', description: 'Dimensioned factory layout drawing demarcating raw material storage, production line, in-house lab, and finished goods warehouse.', required: true },
  ];

  const applicationMilestones: ApplicationMilestone[] = [
    {
      stepNumber: 1,
      title: 'Standard Scope Identification & Gap Analysis',
      subtitle: 'Technical Preparation',
      timeline: 'Days 1 - 5',
      description: `Procure official ${standardCode} standard specification and Scheme of Inspection & Testing (SIT) document from BIS Manakonline.`,
      action: 'Verify in-house manufacturing capabilities against SIT requirements',
    },
    {
      stepNumber: 2,
      title: 'In-House Testing Facility Setup & Calibration',
      subtitle: 'Laboratory Setup',
      timeline: 'Weeks 1 - 2',
      description: 'Install required testing apparatus (HV tester, leakage meter, megger, temperature recorders) and obtain NABL calibration certificates.',
      action: 'Conduct pre-production trial batch testing in-house',
    },
    {
      stepNumber: 3,
      title: 'Online Application Filing on Manakonline (e-BIS)',
      subtitle: 'Statutory Filing',
      timeline: 'Week 3',
      description: 'Fill Form-I on the official e-BIS portal (manakonline.in), upload document checklist, and pay statutory application fee (with 50% MSME concession).',
      action: 'Obtain official BIS Application Acknowledgement Number',
    },
    {
      stepNumber: 4,
      title: 'Preliminary Factory Inspection & Audit',
      subtitle: 'Audit by BIS Officer',
      timeline: 'Weeks 4 - 6',
      description: 'BIS Technical Inspecting Officer visits factory premises, verifies quality controls, audits test records, and draws 2 sets of official counter-samples.',
      action: 'Facilitate factory audit and witness testing in presence of BIS officer',
    },
    {
      stepNumber: 5,
      title: 'Independent Sample Testing at BIS Recognized Lab',
      subtitle: 'Conformity Testing',
      timeline: 'Weeks 6 - 8',
      description: 'Factory counter-samples are dispatched to BIS Central Laboratory or approved NABL lab for independent complete parameter testing.',
      action: 'Track laboratory test report status on LIMS portal',
    },
    {
      stepNumber: 6,
      title: 'Grant of BIS Licence & ISI Standard Mark Affixation',
      subtitle: 'Licence Issuance',
      timeline: 'Week 8 - 10',
      description: 'Upon positive lab test report and audit clearance, BIS issues the prestigious CM/L (Certification Marks Licence) number. Manufacturer starts commercial production with ISI mark.',
      action: 'Maintain continuous surveillance records and submit annual production returns',
    },
  ];

  return {
    query,
    productProfile,
    standardDetails,
    certificationDetails,
    testingDetails,
    documentChecklist,
    applicationMilestones,
    rawMarkdownResponse: replyText,
    citations: citations || [],
    timestamp: Date.now(),
    attachmentName,
  };
}

// Backward compatibility helper
export const generateComplianceDossier = generateProductCertificationGuideData;
