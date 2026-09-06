import { Citation } from './chat';

export type ComplianceApplicability = 
  | 'Mandatory (QCO Notified)' 
  | 'Voluntary Certification' 
  | 'Compulsory Registration (CRS)' 
  | 'Hallmarking Mandate' 
  | 'Under Evaluation';

export type SchemeCategory = 
  | 'Scheme-I (ISI Mark)' 
  | 'Scheme-II (CRS Self-Declaration)' 
  | 'Scheme-IV (Certificate of Conformity)' 
  | 'FMCS (Foreign Manufacturers)' 
  | 'Hallmarking Scheme' 
  | 'Management Systems (ISO)';

export interface ProductProfile {
  name: string;
  category: string;
  industryScale: 'micro' | 'small' | 'medium' | 'large' | 'startup';
  isForeign: boolean;
  manufacturingLocation?: string;
  subType?: string;
  intendedUse?: string;
  keyMaterial?: string;
  technicalSpecs?: string;
  modelVarieties?: string;
}

export interface StandardDetails {
  code: string;
  title: string;
  whyItApplies: string;
  scope: string;
  relatedStandards: string[];
  officialSource: string;
  officialUrl?: string;
}

export interface CertificationDetails {
  isMandatory: boolean;
  applicability: ComplianceApplicability;
  scheme: SchemeCategory;
  qcoNotification: string;
  qcoName?: string;
  notifyingAuthority?: string;
  notificationDate?: string;
  effectiveDate?: string;
  complianceDeadline?: string;
  keyConditions: string[];
  exemptions: string[];
  msmeBenefitDetails?: string;
}

export interface TestItem {
  name: string;
  type: 'Routine Test' | 'Type Test' | 'Acceptance Test';
  description: string;
  clause?: string;
  testMethod?: string;
  equipmentRequirement?: string;
  frequency?: string;
  sampleQuantity?: string;
  remarks?: string;
  sourcePage?: number | string;
}

export interface LabItem {
  id: number;
  labName: string;
  oslCode?: string;
  address: string;
  city: string;
  state: string;
  sourceUrl?: string;
  testingCharge?: number | null;
  currency?: string;
  remarks?: string;
}

export interface GroupingRuleItem {
  groupCode: string;
  groupName: string;
  condition: string;
  sampleRequirement: string;
  preferredSample?: string;
  voltageRequirement?: string;
  remarks?: string;
  sourcePage?: number | string;
}

export interface TestingDetails {
  requiredTests: TestItem[];
  routineTests?: TestItem[];
  typeTests?: TestItem[];
  laboratories?: LabItem[];
  groupingRules?: GroupingRuleItem[];
  labInfo: string;
  samplingProtocol: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Legal' | 'Technical' | 'Quality Control' | 'Testing';
  description: string;
  required: boolean;
  applicableWhen?: string;
  responsibleParty?: string;
  sourceUrl?: string;
  status?: 'Not Uploaded' | 'Scanning' | 'Verified' | 'Discrepancy';
  uploadedFileName?: string;
}

export interface ApplicationMilestone {
  stepNumber: number;
  title: string;
  subtitle: string;
  timeline: string;
  description: string;
  action: string;
  responsibleParty?: string;
  feeType?: string;
  feeAmount?: string;
  sourceUrl?: string;
}

export interface ProductCertificationGuideData {
  query: string;
  productProfile: ProductProfile;
  standardDetails: StandardDetails;
  certificationDetails: CertificationDetails;
  testingDetails: TestingDetails;
  documentChecklist: DocumentItem[];
  applicationMilestones: ApplicationMilestone[];
  rawMarkdownResponse: string;
  citations: Citation[];
  timestamp: number;
  attachmentName?: string;
}

// Backward compatibility alias
export type ComplianceDossier = ProductCertificationGuideData;

