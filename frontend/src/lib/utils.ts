import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSalary(
  min?: number,
  max?: number,
  currency: string = 'USD',
  period: string = 'YEARLY'
): string {
  if (!min && !max) return 'Salary not disclosed'

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  })

  const periodLabel = period === 'YEARLY' ? '/yr' : period === 'MONTHLY' ? '/mo' : '/hr'

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}${periodLabel}`
  }
  if (min) {
    return `${formatter.format(min)}+${periodLabel}`
  }
  return `Up to ${formatter.format(max!)}${periodLabel}`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`

  return formatDate(date)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ''
  const last = lastName?.charAt(0)?.toUpperCase() || ''
  return first + last || '?'
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }
  return 'An unexpected error occurred'
}

export function safeFormatDate(
  dateValue: string | Date | null | undefined,
  formatStr: string = 'MMM d, yyyy',
  fallback: string = '-'
): string {
  if (!dateValue) return fallback
  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return fallback
    // Use Intl for basic formatting when format-fns format isn't needed
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return fallback
  }
}

export function isValidDate(dateValue: string | Date | null | undefined): boolean {
  if (!dateValue) return false
  try {
    const date = new Date(dateValue)
    return !isNaN(date.getTime())
  } catch {
    return false
  }
}
