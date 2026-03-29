import axios from 'axios'
import { token } from '@/utils/token'

const CHAT_BASE = import.meta.env.VITE_CHAT_API_BASE_URL ?? ''

const chatHttp = axios.create({ baseURL: CHAT_BASE, timeout: 10000 })
chatHttp.interceptors.request.use((config) => {
  const t = token.getAccess()
  if (t) config.headers.Authorization = `Bearer ${t}`
  return config
})

export interface Session {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

export interface SessionDetail extends Session {
  messages: Message[]
}

export const chatApi = {
  listSessions: () =>
    chatHttp.get<Session[]>('/api/v1/sessions').then((r) => r.data),

  createSession: (title = '新对话') =>
    chatHttp.post<Session>('/api/v1/sessions', { title }).then((r) => r.data),

  getSession: (sessionId: string) =>
    chatHttp.get<SessionDetail>(`/api/v1/sessions/${sessionId}`).then((r) => r.data),

  deleteSession: (sessionId: string) =>
    chatHttp.delete(`/api/v1/sessions/${sessionId}`),

  generateTitle: (sessionId: string) =>
    chatHttp.post<Session>(`/api/v1/sessions/${sessionId}/generate-title`).then((r) => r.data),

  /** SSE streaming chat — returns an async generator of delta strings */
  async *streamChat(sessionId: string, content: string): AsyncGenerator<string> {
    const accessToken = token.getAccess()
    const resp = await fetch(`${CHAT_BASE}/api/v1/chat/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ content }),
    })

    if (!resp.ok || !resp.body) {
      throw new Error(`Chat request failed: ${resp.status}`)
    }

    const reader = resp.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const raw = line.slice(5).trim()
        if (raw === '[DONE]') return
        try {
          const parsed = JSON.parse(raw) as { delta?: string; error?: string }
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.delta) yield parsed.delta
        } catch {
          // ignore malformed lines
        }
      }
    }
  },
}
