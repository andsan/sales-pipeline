import type { LoginResponse, UploadResult } from '@/types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export interface ApiValidationPayload {
  requiredColumns?: string[]
  foundColumns?: string[]
  missingColumns?: string[]
}

interface ApiErrorBody {
  error?: string
  validation?: ApiValidationPayload | null
}

export class ApiError extends Error {
  status: number
  validation?: ApiValidationPayload | null

  constructor(message: string, status: number, validation?: ApiValidationPayload | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.validation = validation
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText } as ApiErrorBody))
    const errorBody = body as ApiErrorBody
    throw new ApiError(errorBody.error ?? `HTTP ${res.status}`, res.status, errorBody.validation ?? null)
  }

  return res.json() as Promise<T>
}

export const api = {
  login(username: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },

  logout(token: string): Promise<void> {
    return request<void>('/api/auth/logout', { method: 'POST' }, token)
  },

  upload(file: File, token: string): Promise<UploadResult> {
    const form = new FormData()
    form.append('file', file)
    return request<UploadResult>('/api/upload', { method: 'POST', body: form }, token)
  },
}
