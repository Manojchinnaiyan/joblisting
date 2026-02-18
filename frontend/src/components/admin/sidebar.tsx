'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileText,
  FolderTree,
  MessageSquare,
  Settings,
  BarChart3,
  Shield,
  UserCog,
  ChevronDown,
  LogOut,
  BookOpen,
  Database,
  Linkedin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useState } from 'react'
import { useAdminLogout } from '@/hooks/admin/use-admin-auth'
import { useAdminAuthStore } from '@/store/admin-auth-store'

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: { title: string; href: string }[]
  badge?: number
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    icon: Users,
    children: [
      { title: 'All Users', href: '/admin/users' },
      { title: 'Admin Users', href: '/admin/users/admins' },
      { title: 'Create Admin', href: '/admin/users/admins/new' },
    ],
  },
  {
    title: 'Companies',
    icon: Building2,
    children: [
      { title: 'All Companies', href: '/admin/companies' },
      { title: 'Pending Verification', href: '/admin/companies/pending' },
      { title: 'Featured', href: '/admin/companies/featured' },
    ],
  },
  {
    title: 'Jobs',
    icon: Briefcase,
    children: [
      { title: 'All Jobs', href: '/admin/jobs' },
      { title: 'Pending Approval', href: '/admin/jobs/pending' },
      { title: 'Featured', href: '/admin/jobs/featured' },
      { title: 'Import from URL', href: '/admin/jobs/scrape' },
    ],
  },
  {
    title: 'Blog',
    icon: BookOpen,
    children: [
      { title: 'All Posts', href: '/admin/blogs' },
      { title: 'Categories', href: '/admin/blogs/categories' },
      { title: 'Tags', href: '/admin/blogs/tags' },
    ],
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: FolderTree,
  },
  {
    title: 'Reviews',
    icon: MessageSquare,
    children: [
      { title: 'All Reviews', href: '/admin/reviews' },
      { title: 'Pending Moderation', href: '/admin/reviews/pending' },
    ],
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Security',
    href: '/admin/security',
    icon: Shield,
  },
  {
    title: 'LinkedIn',
    href: '/admin/linkedin',
    icon: Linkedin,
  },
  {
    title: 'Cache',
    href: '/admin/cache',
    icon: Database,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function AdminSidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [openItem, setOpenItem] = useState<string | null>(null)
  const { mutate: logout } = useAdminLogout()
  const { user } = useAdminAuthStore()

  const handleLinkClick = () => {
    onNavigate?.()
  }

  // Accordion behavior: only one item can be open at a time
  const toggleItem = (title: string) => {
    setOpenItem((prev) => (prev === title ? null : title))
  }

  const isActive = (href: string) => pathname === href

  const isParentActive = (children?: { href: string }[]) =>
    children?.some((child) => pathname === child.href || pathname.startsWith(child.href + '/'))

  return (
    <div className={cn('flex h-full w-full md:w-64 flex-col overflow-hidden bg-slate-900 text-white', className)}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700 px-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Shield className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">Admin Panel</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon

            if (item.children) {
              const isOpen = openItem === item.title
              const hasActiveChild = isParentActive(item.children)

              return (
                <Collapsible
                  key={item.title}
                  open={isOpen}
                  onOpenChange={() => toggleItem(item.title)}
                >
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        hasActiveChild
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        {item.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-1 space-y-1 pl-10">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={handleLinkClick}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive(child.href)
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href!)
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-slate-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
            <UserCog className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-slate-300 hover:bg-slate-800 hover:text-white"
            asChild
          >
            <Link href="/admin/profile" onClick={handleLinkClick}>Profile</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
