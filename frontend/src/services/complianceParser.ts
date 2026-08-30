import { ComplianceDossier, ComplianceApplicability, SchemeCategory, ComplianceRequirement, RoadmapStep } from '../types/compliance';
import { Citation } from '../types/chat';

/**
 * Known mapping of common products to Indian Standards for high-precision extraction
 */
const KNOWN_STANDARDS_DB: Record<string, { code: string; title: string; qco: boolean; scheme: SchemeCategory }> = {
  kettle: { code: 'IS 302-2-3 / IS 302 (Part 1)', title: 'Safety of Household Electric Kettles & Appliances', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  water: { code: 'IS 10500: 2012 / IS 14543', title: 'Drinking Water & Packaged Natural Mineral Water Specification', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  cable: { code: 'IS 694: 2010', title: 'PVC Insulated Cables for Working Voltages up to 1100 V', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  wire: { code: 'IS 694: 2010', title: 'PVC Insulated Copper/Aluminium Building Wires', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  plug: { code: 'IS 1293: 2019', title: 'Plugs and Socket-Outlets up to 250V / 16A', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  socket: { code: 'IS 1293: 2019', title: 'Plugs and Socket-Outlets Specification', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  cement: { code: 'IS 1489 (Part 1): 2015', title: 'Portland Pozzolana Cement (Fly Ash Based)', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  battery: { code: 'IS 16046 (Part 2): 2018', title: 'Secondary Cells & Lithium-ion Batteries (Portable)', qco: true, scheme: 'Scheme-II (CRS Self-Declaration)' },
  toy: { code: 'IS 9873 (Part 1): 2019', title: 'Safety of Toys - Mechanical and Physical Properties', qco: true, scheme: 'Scheme-I (ISI Mark)' },
  mat: { code: 'IS 15652: 2006', title: 'Insulating Mats for Electrical Purposes', qco: false, scheme: 'Scheme-I (ISI Mark)' },
  gold: { code: 'IS 1417: 2016', title: 'Gold and Gold Alloys, Jewellery/Artefacts - Fineness and Marking', qco: true, scheme: 'Hallmarking Scheme' },
  jewellery: { code: 'IS 1417: 2016', title: 'Gold and Silver Jewellery Assaying & Hallmarking', qco: true, scheme: 'Hallmarking Scheme' },
};

/**
 * Intelligently parse product name from user query
 */
function extractProductName(query: string): string {
  const q = query.toLowerCase();
  
  // Check known keywords first
  for (const [key, val] of Object.entries(KNOWN_STANDARDS_DB)) {
    if (q.includes(key)) {
      // Capitalize
      return key.charAt(0).toUpperCase() + key.slice(1) + (key === 'kettle' || key === 'cable' || key === 'plug' || key === 'wire' || key === 'toy' ? 's' : '');
    }
  }

  // Regex extraction for "I manufacture [product]" or "standard for [product]"
  const match = query.match(/(?:manufacture|produce|import|make|selling|standard for|testing for)\s+([a-zA-Z0-9\s-]{3,28})/i);
  if (match && match[1]) {
    const raw = match[1].replace(/(what|how|which|in|under|according|is|are|the|a|an).*$/i, '').trim();
    if (raw.length > 2) {
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
  }

  return 'Product / Industrial Goods';
}

/**
 * Extract Standard Code & Title from citations and text
 */
function extractStandardInfo(query: string, responseText: string, citations: Citation[]) {
  // Check citations first (ground truth)
  if (citations && citations.length > 0) {
    const firstCit = citations[0];
    const docName = firstCit.document || firstCit.standard_id;
    if (docName && docName.toUpperCase().includes('IS')) {
      return {
        code: docName,
        title: `Indian Standard Specification (${docName})`,
      };
    }
  }

  // Check known keywords in query
  const q = query.toLowerCase();
  for (const [key, val] of Object.entries(KNOWN_STANDARDS_DB)) {
    if (q.includes(key)) {
      return {
        code: val.code,
        title: val.title,
      };
    }
  }

  // Regex pattern for IS code in response text e.g. "IS 302", "IS 10500:2012", "IS 1293-2019"
  const isMatch = responseText.match(/\b(IS\s+\d+(?:[\s:-]+(?:Part\s+\d+|Section\s+\d+|\d+))*(?:\s*:\s*\d{4})?)\b/i);
  if (isMatch) {
    return {
      code: isMatch[1].toUpperCase(),
      title: `Indian Standard Specification for ${extractProductName(query)}`,
    };
  }

  return {
    code: 'IS Standard Applicable',
    title: 'Indian Standard Conformity Specification',
  };
}

/**
 * Builds a structured ComplianceDossier from user query, AI response, and citations
 */
export function generateComplianceDossier(
  query: string,
  replyText: string,
  citations: Citation[],
  attachmentName?: string
): ComplianceDossier {
  const productName = extractProductName(query);
  const standardInfo = extractStandardInfo(query, replyText, citations);

  // Determine Applicability
  let applicability: ComplianceApplicability = 'Mandatory (QCO Notified)';
  let scheme: SchemeCategory = 'Scheme-I (ISI Mark)';
  let qcoNotification = 'Quality Control Order (QCO) issued by Ministry of Consumer Affairs / DPIIT / MeitY.';

  const lowerText = replyText.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerText.includes('crs') || lowerText.includes('compulsory registration') || lowerQuery.includes('battery') || lowerQuery.includes('laptop') || lowerQuery.includes('mobile')) {
    applicability = 'Compulsory Registration (CRS)';
    scheme = 'Scheme-II (CRS Self-Declaration)';
    qcoNotification = 'MeitY Electronics & Information Technology Goods (Compulsory Registration) Order.';
  } else if (lowerText.includes('hallmark') || lowerQuery.includes('gold') || lowerQuery.includes('jewellery')) {
    applicability = 'Hallmarking Mandate';
    scheme = 'Hallmarking Scheme';
    qcoNotification = 'Hallmarking of Gold Jewellery and Gold Artefacts Order 2020.';
  } else if (lowerText.includes('voluntary') || lowerText.includes('optional')) {
    applicability = 'Voluntary Certification';
    qcoNotification = 'Voluntary third-party quality certification under Scheme-I.';
  }

  // Generate 4-Pillar Requirements
  const requirements: ComplianceRequirement[] = [
    {
      title: 'Mandatory Laboratory Testing',
      category: 'Testing',
      description: `Complete parameter testing in accordance with ${standardInfo.code} at in-house laboratory or BIS-recognized NABL laboratory.`,
      details: [
        'Routine and acceptance testing as per Scheme of Inspection and Testing (SIT)',
        'Sample evaluation by BIS Apex Central Laboratory or approved commercial test house',
        'Independent surveillance testing during licence tenure',
      ],
      mandatory: true,
    },
    {
      title: 'In-House Quality Control & Documentation',
      category: 'Documentation',
      description: 'Establishment of manufacturing quality manual, equipment calibration records, and process controls.',
      details: [
        'Complete list of in-house testing equipment with valid calibration certificates',
        'Raw material test certificates (MTC) and supplier qualification records',
        'Manufacturing process flowchart and quality control personnel details',
      ],
      mandatory: true,
    },
    {
      title: 'Factory Inspection & Verification Audit',
      category: 'Factory QC',
      description: 'Physical or hybrid audit of manufacturing premises by BIS Inspecting Officer (Technical Auditor).',
      details: [
        'Verification of manufacturing infrastructure and testing competence',
        'Drawing of official factory counter-samples for independent lab testing',
        'Verification of competency of technical quality control personnel',
      ],
      mandatory: scheme.includes('Scheme-I'),
    },
    {
      title: 'Standard Marking & Packaging Rules',
      category: 'Marking',
      description: `Affixation of official Standard Mark (${scheme.includes('CRS') ? 'CRS Logo' : 'ISI Mark'}) with unique CM/L licence number.`,
      details: [
        `Standard Mark with designated Indian Standard number (${standardInfo.code})`,
        'Display of 7 or 8-digit CML (Certification Mark Licence) or R-Number',
        'Batch number, manufacturing date, and MRP marking on retail packaging',
      ],
      mandatory: true,
    },
  ];

  // Generate 6-Step Certification Roadmap
  const roadmap: RoadmapStep[] = [
    {
      stepNumber: 1,
      title: 'Identify Indian Standard & QCO Scope',
      subtitle: standardInfo.code,
      description: `Confirm exact product scope, applicable clauses under ${standardInfo.code}, and relevant Quality Control Order mandate.`,
      actionItem: 'Download official standard specification on Manakonline',
      status: 'completed',
      estimatedTimeline: 'Day 1 - 3',
    },
    {
      stepNumber: 2,
      title: 'Setup In-House Lab & Quality Controls',
      subtitle: 'Testing Infrastructure',
      description: 'Procure required testing apparatus specified in Scheme of Inspection and Testing (SIT) and calibrate instruments.',
      actionItem: 'Ensure qualified technical QC staff are appointed',
      status: 'current',
      estimatedTimeline: 'Week 1 - 2',
    },
    {
      stepNumber: 3,
      title: 'Sample Testing at BIS Recognized Lab',
      subtitle: 'Conformity Assessment',
      description: 'Send test batches to BIS Central Lab or recognized NABL testing facility to obtain compliant test report.',
      actionItem: 'Verify test report validity (within 90 days)',
      status: 'upcoming',
      estimatedTimeline: 'Week 2 - 4',
    },
    {
      stepNumber: 4,
      title: 'Online Application Filing on Manakonline',
      subtitle: 'Statutory Submission',
      description: 'Submit Form-I on e-BIS portal (manakonline.in) with manufacturing details, test reports, and fee payment.',
      actionItem: 'Attach Udyam Certificate for 50% MSME concession',
      status: 'upcoming',
      estimatedTimeline: 'Week 4 - 5',
    },
    {
      stepNumber: 5,
      title: 'Preliminary Factory Inspection & Audit',
      subtitle: 'Audit by BIS Officer',
      description: 'BIS technical officer visits manufacturing facility, reviews quality systems, and draws official counter-samples.',
      actionItem: 'Keep factory logs and calibration records ready',
      status: 'upcoming',
      estimatedTimeline: 'Week 5 - 7',
    },
    {
      stepNumber: 6,
      title: 'Grant of BIS Licence & ISI Mark Affixation',
      subtitle: 'CM/L Number Issuance',
      description: 'Upon positive test reports and audit clearance, BIS issues CM/L licence. Manufacturer begins affixing ISI mark.',
      actionItem: 'Maintain surveillance register and submit production returns',
      status: 'upcoming',
      estimatedTimeline: 'Week 8',
    },
  ];

  // Clean Summary
  const summary = `Compliance consultation summary for ${productName}: Governed by ${standardInfo.code} under ${scheme}. Status: ${applicability}.`;

  return {
    query,
    productName,
    applicableStandard: standardInfo,
    applicability,
    qcoNotification,
    scheme,
    summary,
    fullMarkdownResponse: replyText,
    requirements,
    roadmap,
    citations: citations || [],
    timestamp: Date.now(),
    attachmentName,
  };
}
