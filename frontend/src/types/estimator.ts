export type SchemeType = 
  | 'scheme_1'         // ISI Mark (Product Certification)
  | 'scheme_2'         // CRS (Compulsory Registration Scheme for Electronics & IT)
  | 'scheme_4'         // Certificate of Conformity
  | 'hallmarking'      // Gold & Silver Jewellery Hallmarking
  | 'management_sys';  // Management Systems Certification (ISO 9001/14001/22000)

export type IndustryScale = 
  | 'micro'            // Micro Enterprise (50% concession on application & marking fee)
  | 'small'            // Small Enterprise (20% concession)
  | 'medium'           // Medium Enterprise
  | 'large'            // Large Industry
  | 'startup';         // DPIIT Recognized / Women Entrepreneur (50% concession)

export interface FeeCalculationInput {
  schemeType: SchemeType;
  industryScale: IndustryScale;
  productCount: number;
  testSampleCount: number;
  isForeignManufacturer: boolean;
}

export interface FeeItemBreakdown {
  label: string;
  baseAmount: number;
  discountAmount: number;
  netAmount: number;
  frequency: 'one-time' | 'annual' | 'per-sample';
  description: string;
}

export interface FeeCalculationResult {
  schemeName: string;
  scaleLabel: string;
  breakdown: FeeItemBreakdown[];
  totalFirstYearCost: number;
  totalConcessionSaved: number;
  concessionPercentage: number;
  schemeGuidelines: string[];
  applicableStandardNotice: string;
}
