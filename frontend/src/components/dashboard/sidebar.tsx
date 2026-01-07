'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, createContext, useContext } from 'react'
import {
  LayoutDashboard,
  User,
  FileText,
  FilePlus2,
  FileEdit,
  Briefcase,
  Bookmark,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useProfile } from '@/hooks/use-profile'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Sidebar context for sharing collapsed state
interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    children: [
      { name: 'Overview', href: '/profile' },
      { name: 'Edit Profile', href: '/profile/edit' },
      { name: 'Experience', href: '/profile/experience' },
      { name: 'Education', href: '/profile/education' },
      { name: 'Skills', href: '/profile/skills' },
      { name: 'Certifications', href: '/profile/certifications' },
      { name: 'Portfolio', href: '/profile/portfolio' },
    ],
  },
  {
    name: 'Resumes',
    href: '/resumes',
    icon: FileText,
  },
  {
    name: 'Resume Builder',
    href: '/resume-builder',
    icon: FilePlus2,
  },
  {
    name: 'Cover Letter',
    href: '/cover-letter-builder',
    icon: FileEdit,
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: Briefcase,
  },
  {
    name: 'Saved Jobs',
    href: '/saved-jobs',
    icon: Bookmark,
  },
  {
    name: 'Following',
    href: '/following',
    icon: Building2,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  isCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ isCollapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout: userLogout } = useAuthStore()
  const { logout: adminLogout } = useAdminAuthStore()
  const { data: profile } = useProfile()

  const handleLogout = () => {
    userLogout()
    adminLogout()
    toast.success('Logged out successfully')
    window.location.href = '/'
  }

  const toggleCollapse = () => {
    onCollapsedChange?.(!isCollapsed)
  }

  const NavItem = ({ item, isActive }: { item: typeof navigation[0]; isActive: boolean }) => {
    const Icon = item.icon

    if (isCollapsed) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center justify-center rounded-lg p-2 transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex items-center gap-2">
              {item.name}
              {item.children && <ChevronRight className="h-3 w-3" />}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (item.children) {
      return (
        <div className="space-y-1">
          <Link
            href={item.href}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.name}</span>
            <ChevronRight className="ml-auto h-4 w-4 shrink-0" />
          </Link>
          {isActive && (
            <div className="ml-8 space-y-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'block w-full rounded-lg px-3 py-2 text-sm transition-colors',
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
        href={item.href}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{item.name}</span>
      </Link>
    )
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo and Notifications */}
      <div className={cn(
        'flex h-16 items-center border-b',
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {isCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" className="text-xl font-bold">
                  J
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">JobsWorld</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            <Link href="/" className="text-xl font-bold">
              JobsWorld
            </Link>
            <NotificationBell notificationsHref="/notifications" />
          </>
        )}
      </div>

      {/* Collapse Toggle */}
      <div className={cn('p-2', isCollapsed ? 'flex justify-center' : 'flex justify-end')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        'flex-1 space-y-1 overflow-y-auto',
        isCollapsed ? 'px-2' : 'px-4'
      )}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <NavItem key={item.name} item={item} isActive={isActive} />
          )
        })}
      </nav>

      {/* User Section */}
      <div className={cn('border-t', isCollapsed ? 'p-2' : 'p-4')}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user?.email}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Export a provider component to manage sidebar state across the app
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
  }, [])

  // Save state to localStorage
  const handleCollapsedChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed: handleCollapsedChange }}>
      {children}
    </SidebarContext.Provider>
  )
}
