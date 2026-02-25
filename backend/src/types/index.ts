export type UserRole = 'admin' | 'uploader';

export interface User {
  username: string;
  passwordHash: string;
  role: UserRole;
}

export interface JwtPayload {
  username: string;
  role: UserRole;
}

export interface UploadResult {
  blobPath: string;
  rowCount: number;
  originalFileName: string;
  submissionId: string;
  submittedBy: string;
  submittedAt: string;
}

export interface ValidationError {
  row?: number;
  field?: string;
  message: string;
}
