export interface Job {
  id: number;
  title: string;
  company: string;
  url: string | null;
  original_description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  location: string | null;
  remote_type: string | null;
  status: string;
  date_found: string;
  date_applied: string | null;
  notes: string | null;
  parsed_requirements: string | null;
  parsed_responsibilities: string | null;
  parsed_preferred: string | null;
  parsed_company_info: string | null;
  parsed_compensation: string | null;
  parsed_match_score: number | null;
  parsed_match_analysis: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeSection {
  id: number;
  section_type: string;
  section_order: number;
  title: string | null;
  content: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface JobNote {
  id: number;
  job_id: number;
  note: string;
  note_type: string;
  created_at: string;
}
