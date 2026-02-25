export type UserRole = 'admin' | 'uploader'

export interface LoginResponse {
  token: string
  username: string
  role: UserRole
}

export interface UploadResult {
  blobPath: string
  rowCount: number
  originalFileName: string
  downloadUrl: string | null
  submissionId: string
  submittedBy: string
  submittedAt: string
}

export type UploadStep = 'idle' | 'done' | 'error'
