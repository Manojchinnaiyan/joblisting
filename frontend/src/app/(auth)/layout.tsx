import { Logo } from '@/components/shared/logo'
import { Container } from '@/components/layout/container'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <Container>
          <div className="flex h-16 items-center">
            <Logo />
          </div>
        </Container>
      </header>
      <main className="flex-1 flex items-center justify-center py-12">
        <Container>
          <div className="mx-auto w-full max-w-md">
            {children}
          </div>
        </Container>
      </main>
    </div>
  )
}
