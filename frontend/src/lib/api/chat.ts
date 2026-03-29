import type { ChatApiResponse, ChatRequest } from '@/types/chat'

// Calls the Next.js API route at /api/chat — no backend restart needed,
// no auth required, 60s timeout to handle Claude latency.
export const chatApi = {
  sendMessage: async (req: ChatRequest): Promise<ChatApiResponse> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(60000),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Request failed (${res.status})`)
    }
    return res.json()
  },
}
