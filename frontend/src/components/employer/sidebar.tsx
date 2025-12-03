'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  Briefcase,
  FileText,
  Search,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useMyCompany } from '@/hooks/employer/use-company'
import { Badge } from '@/components/ui/badge'
import { authApi } from '@/lib/api/auth'
import { useRouter } from 'next/navigation'
import { NotificationBell } from '@/components/notifications/notification-bell'

const navigation = [
  {
    name: 'Dashboard',
    href: '/employer',
    icon: LayoutDashboard,
  },
  {
    name: 'Company',
    href: '/company',
    icon: Building2,
    children: [
      { name: 'Profile', href: '/company' },
      { name: 'Edit Profile', href: '/company/edit' },
      { name: 'Branding', href: '/company/branding' },
      { name: 'Locations', href: '/company/locations' },
      { name: 'Benefits', href: '/company/benefits' },
      { name: 'Media', href: '/company/media' },
      { name: 'Verification', href: '/company/verification' },
      { name: 'Reviews', href: '/company/reviews' },
    ],
  },
  {
    name: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    name: 'Jobs',
    href: '/employer-jobs',
    icon: Briefcase,
    children: [
      { name: 'All Jobs', href: '/employer-jobs' },
      { name: 'Post New Job', href: '/employer-jobs/new' },
      { name: 'Import Jobs', href: '/employer-jobs/import' },
    ],
  },
  {
    name: 'Applications',
    href: '/employer-applications',
    icon: FileText,
  },
  {
    name: 'Candidates',
    href: '/candidates',
    icon: Search,
    children: [
      { name: 'Search', href: '/candidates' },
      { name: 'Saved', href: '/candidates/saved' },
    ],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/employer-settings',
    icon: Settings,
  },
]

export function EmployerSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, refreshToken } = useAuthStore()
  const { data: company } = useMyCompany()

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      logout()
      router.push('/')
    }
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Company Header */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        {company?.logo_url ? (
          <Avatar className="h-10 w-10">
            <AvatarImage src={company.logo_url} alt={company.name} />
            <AvatarFallback>{company.name.charAt(0)}</AvatarFallback>
          </Avatar>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            {company?.name?.charAt(0) || 'C'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{company?.name || 'Your Company'}</p>
            {company?.is_verified && (
              <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">Employer Portal</p>
        </div>
        <NotificationBell notificationsHref="/employer-notifications" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (item.children) {
            return (
              <div key={item.name} className="space-y-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                  <ChevronRight
                    className={cn(
                      'ml-auto h-4 w-4 transition-transform',
                      isActive && 'rotate-90'
                    )}
                  />
                </Link>
                {isActive && (
                  <div className="ml-8 space-y-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar>
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <Badge variant="outline" className="text-xs">Employer</Badge>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
