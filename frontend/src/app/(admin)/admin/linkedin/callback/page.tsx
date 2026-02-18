'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useConnectLinkedIn } from '@/hooks/admin/use-admin-linkedin'

export default function LinkedInCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate: connectLinkedIn, isPending } = useConnectLinkedIn()
  const hasProcessed = useRef(false)

  useEffect(() => {
    if (hasProcessed.current) return
    hasProcessed.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      router.replace('/admin/linkedin?error=' + encodeURIComponent(error))
      return
    }

    if (!code) {
      router.replace('/admin/linkedin?error=missing_code')
      return
    }

    connectLinkedIn(
      { code, state: state || undefined },
      {
        onSuccess: () => {
          router.replace('/admin/linkedin?connected=true')
        },
        onError: () => {
          router.replace('/admin/linkedin?error=callback_failed')
        },
      }
    )
  }, [searchParams, connectLinkedIn, router])

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-4 text-sm text-muted-foreground">
          {isPending ? 'Connecting LinkedIn...' : 'Processing...'}
        </p>
      </div>
    </div>
  )
}
