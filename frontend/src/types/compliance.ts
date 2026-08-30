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

export interface ComplianceRequirement {
  title: string;
  category: 'Testing' | 'Documentation' | 'Factory QC' | 'Marking';
  description: string;
  details: string[];
  mandatory: boolean;
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  description: string;
  actionItem?: string;
  status: 'completed' | 'current' | 'upcoming';
  estimatedTimeline?: string;
}

export interface ComplianceDossier {
  query: string;
  productName: string;
  applicableStandard: {
    code: string;
    title: string;
    category?: string;
    year?: string;
  };
  applicability: ComplianceApplicability;
  qcoNotification?: string;
  scheme: SchemeCategory;
  summary: string;
  fullMarkdownResponse: string;
  requirements: ComplianceRequirement[];
  roadmap: RoadmapStep[];
  citations: Citation[];
  timestamp: number;
  attachmentName?: string;
}
