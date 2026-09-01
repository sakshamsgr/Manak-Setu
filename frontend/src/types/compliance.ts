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
  manufacturingLocation: string;
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
  keyConditions: string[];
  exemptions: string[];
}

export interface TestItem {
  name: string;
  type: 'Routine Test' | 'Type Test' | 'Acceptance Test';
  description: string;
}

export interface TestingDetails {
  requiredTests: TestItem[];
  labInfo: string;
  samplingProtocol: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Legal' | 'Technical' | 'Quality Control' | 'Testing';
  description: string;
  required: boolean;
}

export interface ApplicationMilestone {
  stepNumber: number;
  title: string;
  subtitle: string;
  timeline: string;
  description: string;
  action: string;
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
