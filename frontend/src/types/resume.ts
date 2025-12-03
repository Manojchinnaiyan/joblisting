export interface Resume {
  id: string
  user_id: string
  file_name: string
  original_name: string
  title: string
  file_path: string
  file_size: number
  file_type: string
  is_primary: boolean
  download_url?: string
  created_at: string
  updated_at: string
}

export interface UploadResumeRequest {
  file: File
  title: string
}

export interface UpdateResumeRequest {
  title: string
}
