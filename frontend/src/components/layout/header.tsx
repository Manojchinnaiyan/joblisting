'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Logo } from '@/components/shared/logo'
import { Navbar } from './navbar'
import { MobileNav } from './mobile-nav'
import { Container } from './container'
import { useAuthStore } from '@/store/auth-store'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { authApi } from '@/lib/api/auth'
import { ROUTES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function Header() {
  const { user, isAuthenticated, logout: userLogout, refreshToken, _hasHydrated } = useAuthStore()
  const { logout: adminLogout } = useAdminAuthStore()

  // Don't render auth-dependent UI until zustand has hydrated to prevent hydration mismatch
  const showAuthUI = _hasHydrated

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (error) {
      // Ignore API errors - we still want to clear local state
      console.error('Logout API error:', error)
    } finally {
      // Always clear local state (both user and admin) and redirect
      userLogout()
      adminLogout()
      toast.success('Logged out successfully')
      // Use window.location for full page reload to ensure clean state
      window.location.href = '/'
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo />
            <Navbar />
          </div>

          <div className="flex items-center gap-4">
            {showAuthUI && !isAuthenticated && (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/register?role=employer">Hire Talent</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={ROUTES.JOBS}>Find a Job</Link>
                </Button>
              </div>
            )}
            {showAuthUI && isAuthenticated && user ? (
              <>
                <NotificationBell notificationsHref="/notifications" />
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url} alt={user.first_name} />
                      <AvatarFallback>
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.DASHBOARD}>Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={ROUTES.PROFILE}>Profile</Link>
                  </DropdownMenuItem>
                  {user.role === 'JOB_SEEKER' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={ROUTES.APPLICATIONS}>Applications</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={ROUTES.SAVED_JOBS}>Saved Jobs</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'EMPLOYER' && (
                    <DropdownMenuItem asChild>
                      <Link href={ROUTES.EMPLOYER}>Employer Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            ) : showAuthUI ? (
              <>
                <Button variant="ghost" asChild className="hidden sm:flex">
                  <Link href={ROUTES.LOGIN}>Log in</Link>
                </Button>
                <Button asChild>
                  <Link href={ROUTES.REGISTER}>Sign up</Link>
                </Button>
              </>
            ) : null}

            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  )
}
