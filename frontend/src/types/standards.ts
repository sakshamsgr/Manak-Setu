export interface IndianStandard {
  id: string;
  code: string;
  title: string;
  category: 'Electrical & Electronics' | 'Food & Agriculture' | 'Civil Engineering' | 'Chemical' | 'Mechanical' | 'Textiles' | 'Medical Equipment';
  year: string;
  status: 'Active' | 'Mandatory QCO';
  scope: string;
  productKeywords: string[];
  keyTests: string[];
  officialUrl?: string;
}

export interface BISLab {
  id: string;
  name: string;
  type: 'Central Laboratory' | 'Regional Laboratory' | 'Branch Laboratory' | 'BIS Recognized Lab';
  city: string;
  state: string;
  address: string;
  contactEmail: string;
  phone: string;
  disciplines: string[];
  accreditation: string;
}
