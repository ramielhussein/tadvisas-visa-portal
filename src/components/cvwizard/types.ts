export interface CVFormData {
  // Identity
  name: string;
  passport_no: string;
  passport_expiry: string;
  nationality_code: string;
  age: number;
  religion: string;
  maid_status: string;
  
  // Jobs & Vitals
  job1: string;
  job2: string;
  height_cm: number;
  weight_kg: number;
  marital_status: string;
  children: number;
  
  // Languages
  languages: Array<{ name: string; level: string }>;
  
  // Education
  education: {
    track: string;
    status?: string;
    attended_years?: number;
    speciality?: string;
  };
  
  // Experience
  experience: Array<{ country: string; years: number }>;
  
  // Skills
  skills: {
    baby_sit: boolean;
    new_born: boolean;
    iron: boolean;
    wash: boolean;
    dish_wash: boolean;
    clean: boolean;
    drive: boolean;
    cook: boolean;
    cook_details?: string;
    tutor: boolean;
    housekeeping: boolean;
    computer_skills: boolean;
  };
  
  // Visa
  visa: {
    status: string;
    overstay_or_grace_date?: string;
  };
  
  // Files
  files: {
    photo?: File;
    passport?: File;
    medical?: File;
    pcc?: File;
    entry_permit?: File;
    visit_visa?: File;
    video?: File;
    other_1?: File;
    other_2?: File;
    other_3?: File;
  };
  
  // Financials
  financials: {
    costs: Array<{ label: string; amount: number }>;
    revenues: Array<{ label: string; amount: number }>;
  };
  
  // Salary
  salary?: number;
  
  // Consent
  consent: boolean;
}
