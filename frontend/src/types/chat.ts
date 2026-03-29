import type { Job } from './job'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  jobs?: Job[]
  intent?: 'job_search' | 'general'
  userQuery?: string // original user message, used for "View all jobs" link
}

export interface ChatRequest {
  message: string
  history: { role: string; content: string }[]
}

export interface ChatApiResponse {
  reply: string
  jobs?: Job[]
  intent: 'job_search' | 'general'
}
