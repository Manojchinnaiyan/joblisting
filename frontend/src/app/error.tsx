'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Container>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-6">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </Container>
    </div>
  )
}
