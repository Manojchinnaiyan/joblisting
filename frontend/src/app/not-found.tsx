import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/layout/container'
import { ROUTES } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Container>
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The page you are looking for does not exist.
          </p>
          <Button asChild>
            <Link href={ROUTES.HOME}>Go Home</Link>
          </Button>
        </div>
      </Container>
    </div>
  )
}
