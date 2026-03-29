'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, BriefcaseIcon, MapPin, Building2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { chatApi } from '@/lib/api/chat'
import type { ChatMessage } from '@/types/chat'
import type { Job } from '@/types/job'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

function JobCard({ job, onClose }: { job: Job; onClose: () => void }) {
  return (
    <Link
      href={`/jobs/${job.slug}`}
      onClick={onClose}
      className="block rounded-lg border bg-background p-3 hover:border-primary/50 hover:bg-muted/50 transition-colors mt-2"
    >
      <p className="font-medium text-sm line-clamp-1">{job.title}</p>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          {job.company_name}
        </span>
        {job.city && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.city}
          </span>
        )}
        {job.workplace_type === 'REMOTE' && (
          <span className="text-green-600 font-medium">Remote</span>
        )}
      </div>
      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
              {s}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="text-xs text-muted-foreground">+{job.skills.length - 4} more</span>
          )}
        </div>
      )}
    </Link>
  )
}

function renderContent(text: string) {
  return text.split('\n').map((line, i, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <span key={i}>
        {parts.map((part, j) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={j}>{part.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
        {i < arr.length - 1 && <br />}
      </span>
    )
  })
}

function MessageBubble({ msg, onClose }: { msg: ChatMessage; onClose: () => void }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? 'order-1' : ''}`}>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          }`}
        >
          {renderContent(msg.content)}
        </div>
        {!isUser && msg.jobs && msg.jobs.length > 0 && (
          <div className="mt-1 space-y-1">
            <p className="text-xs text-muted-foreground px-1">
              {msg.jobs.length} matching job{msg.jobs.length !== 1 ? 's' : ''}
            </p>
            {msg.jobs.slice(0, 3).map((job) => (
              <JobCard key={job.id} job={job} onClose={onClose} />
            ))}
            {msg.jobs.length > 3 && (
              <Link
                href={`/jobs${msg.userQuery ? `?q=${encodeURIComponent(msg.userQuery)}` : ''}`}
                onClick={onClose}
                className="block text-xs text-primary hover:underline px-1 pt-1"
              >
                View all {msg.jobs.length} jobs →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: "Hi! I'm your JobsWorld assistant. Ask me to find jobs, or ask anything about your career — I'm here to help!",
}

export function ChatWidget() {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Close when clicking outside both the panel and the toggle button
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const insidePanel = panelRef.current?.contains(target)
      const insideToggle = toggleRef.current?.contains(target)
      if (!insidePanel && !insideToggle) {
        setOpen(false)
      }
    }
    // Use setTimeout so the mousedown that opened the chat doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = messages
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }))

      const result = await chatApi.sendMessage({ message: text, history })

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
          jobs: result.jobs,
          intent: result.intent,
          userQuery: text,
        },
      ])
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Sorry, something went wrong. Please try again.'
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (file.type !== 'application/pdf') {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Please upload a PDF file for resume analysis.' }])
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'File size must be less than 5MB.' }])
      return
    }

    setMessages((prev) => [...prev, { role: 'user', content: `📎 Analyze my resume: ${file.name}` }])
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to analyze resume' }))
        throw new Error(err.error || 'Failed to analyze resume')
      }

      const result = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
          jobs: result.jobs,
          intent: result.intent,
          userQuery: file.name,
        },
      ])
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : "Sorry, I couldn't analyze your resume. Please try again."
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-20 right-4 z-50 w-[350px] sm:w-[380px] flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden"
          style={{ maxHeight: 'min(560px, calc(100vh - 100px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="h-4 w-4" />
              <span className="font-semibold text-sm">JobsWorld Assistant</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} onClose={() => setOpen(false)} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5 flex items-center gap-2 bg-background">
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf"
              onChange={handleResumeSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (_hasHydrated && !isAuthenticated) {
                  setOpen(false)
                  router.push('/auth/login')
                } else {
                  resumeInputRef.current?.click()
                }
              }}
              disabled={loading}
              title={isAuthenticated ? 'Upload PDF resume for AI job matching' : 'Sign in to upload resume'}
              className="text-foreground/60 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10 disabled:opacity-50 shrink-0 border border-transparent hover:border-primary/20"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask me about jobs or your career..."
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
              maxLength={2000}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="rounded-full h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating toggle button — always visible */}
      <button
        ref={toggleRef}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Open chat assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}
