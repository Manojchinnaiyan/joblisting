export interface Certification {
  id: string
  user_id: string
  name: string
  issuing_organization: string
  issue_date: string
  expiry_date?: string
  no_expiry: boolean
  credential_id?: string
  credential_url?: string
  certificate_file_path?: string
  certificate_url?: string
  created_at: string
  updated_at: string
}

export interface CreateCertificationRequest {
  name: string
  issuing_organization: string
  issue_date: string
  expiry_date?: string
  no_expiry: boolean
  credential_id?: string
  credential_url?: string
}

export interface UpdateCertificationRequest extends CreateCertificationRequest {}
