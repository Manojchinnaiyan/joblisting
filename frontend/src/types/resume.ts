export interface Resume {
  id: string
  user_id: string
  file_name: string
  original_name: string
  title: string
  file_size: number
  mime_type: string
  is_primary: boolean
  download_count: number
  uploaded_at: string
  updated_at: string
  download_url?: string
}

export interface UploadResumeRequest {
  file: File
  title: string
}

export interface UpdateResumeRequest {
  title: string
}
