import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

const SYSTEM_PROMPT = `You are JobsWorld Assistant, a career helper for JobsWorld.in.

Rules:
- Keep every reply to 1-2 sentences MAX. Never list your capabilities.
- When the user asks for jobs (any phrasing), immediately search and show them. Don't explain what you're doing.
- When the user says "show me jobs based on my resume" or similar without uploading, tell them in one sentence to click the 📎 paperclip icon to upload their PDF resume.

When searching for jobs, include a search block at the end of your reply:
<SEARCH>{"skills":["Go","PostgreSQL"],"keywords":"golang backend","experience_level":"","location":"","remote":false}</SEARCH>

Search block fields:
- skills: technical skills mentioned
- keywords: best job title/role to search
- experience_level: "ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE" or empty
- location: city/region or empty
- remote: true only if user explicitly says remote

For non-job questions (salary, interview tips, career advice), answer in 1-2 sentences without the search block.`

const RESUME_SYSTEM_PROMPT = `You are JobsWorld Assistant. Analyze the resume and find matching jobs.

Respond with 1-2 sentences about the candidate's strongest skills and best-fit role, then include the search block:
<SEARCH>{"skills":["React","TypeScript"],"keywords":"frontend developer","experience_level":"MID","location":"","remote":false}</SEARCH>

Guidelines:
- skills: all key technical skills found
- keywords: the best job title to search for
- experience_level: ENTRY (0-2 yrs), MID (2-5 yrs), SENIOR (5-8 yrs), LEAD (8+ yrs)
- location: empty unless they mention a preference
- remote: true only if they mention remote preference`

interface ChatMessage {
  role: string
  content: string
}

interface SearchIntent {
  skills: string[]
  keywords: string
  experience_level: string
  location: string
  remote: boolean
}

async function searchJobs(intent: SearchIntent) {
  const query = async (q: string, expLevel: boolean): Promise<unknown[]> => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (expLevel && intent.experience_level) params.set('experience_level', intent.experience_level)
    if (intent.location) params.set('location', intent.location)
    if (intent.remote) params.set('workplace_type', 'REMOTE')
    params.set('limit', '8')
    try {
      const res = await fetch(`${API_URL}/jobs?${params.toString()}`, { next: { revalidate: 0 } })
      if (!res.ok) return []
      const json = await res.json()
      return json.data?.jobs ?? []
    } catch {
      return []
    }
  }

  // Strategy 1: keywords + experience level
  if (intent.keywords) {
    const jobs = await query(intent.keywords, true)
    if (jobs.length > 0) return jobs

    // Strategy 2: keywords only (drop experience level — too strict)
    const jobs2 = await query(intent.keywords, false)
    if (jobs2.length > 0) return jobs2
  }

  // Strategy 3: first skill as fallback
  if (intent.skills?.length > 0) {
    const jobs3 = await query(intent.skills[0], false)
    if (jobs3.length > 0) return jobs3
  }

  return []
}

async function handleResumeUpload(req: NextRequest): Promise<Response> {
  const formData = await req.formData()
  const file = formData.get('resume')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No resume file provided' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: RESUME_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this resume and find me matching jobs.',
            },
          ],
        },
      ],
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    console.error('Anthropic resume error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }

  const anthropicData = await anthropicRes.json()
  const raw: string = anthropicData.content?.[0]?.text ?? ''

  const searchMatch = raw.match(/<SEARCH>([\s\S]*?)<\/SEARCH>/)
  const reply = raw.replace(/<SEARCH>[\s\S]*?<\/SEARCH>/g, '').trim()

  if (!searchMatch) {
    return NextResponse.json({ reply, jobs: [], intent: 'general' })
  }

  let intent: SearchIntent = { skills: [], keywords: '', experience_level: '', location: '', remote: false }
  try {
    intent = JSON.parse(searchMatch[1].trim())
  } catch {
    return NextResponse.json({ reply, jobs: [], intent: 'general' })
  }

  const jobs = await searchJobs(intent)
  return NextResponse.json({ reply, jobs, intent: 'job_search' })
}

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const contentType = req.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    return handleResumeUpload(req)
  }

  let body: { message: string; history: ChatMessage[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { message, history = [] } = body
  if (!message || typeof message !== 'string' || message.length > 2000) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
  }

  // Build messages for Claude
  const messages = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ]

  // Call Anthropic
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  })

  if (!anthropicRes.ok) {
    const err = await anthropicRes.text()
    console.error('Anthropic error:', err)
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }

  const anthropicData = await anthropicRes.json()
  const raw: string = anthropicData.content?.[0]?.text ?? ''

  // Extract <SEARCH> block
  const searchMatch = raw.match(/<SEARCH>([\s\S]*?)<\/SEARCH>/)
  const reply = raw.replace(/<SEARCH>[\s\S]*?<\/SEARCH>/g, '').trim()

  if (!searchMatch) {
    return NextResponse.json({ reply, jobs: [], intent: 'general' })
  }

  let intent: SearchIntent = { skills: [], keywords: '', experience_level: '', location: '', remote: false }
  try {
    intent = JSON.parse(searchMatch[1].trim())
  } catch {
    return NextResponse.json({ reply, jobs: [], intent: 'general' })
  }

  const jobs = await searchJobs(intent)
  return NextResponse.json({ reply, jobs, intent: 'job_search' })
}
