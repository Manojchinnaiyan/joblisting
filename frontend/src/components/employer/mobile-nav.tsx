'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { EmployerSidebar } from './sidebar'
import { useState, useEffect, useRef } from 'react'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { useMyCompany } from '@/hooks/employer/use-company'
import { NotificationBell } from '@/components/notifications/notification-bell'

const mobileNav = [
  {
    name: 'Dashboard',
    href: '/employer',
    icon: LayoutDashboard,
  },
  {
    name: 'Company',
    href: '/company',
    icon: Building2,
  },
  {
    name: 'Jobs',
    href: '/employer-jobs',
    icon: Briefcase,
  },
  {
    name: 'Applications',
    href: '/employer-applications',
    icon: FileText,
  },
]

export function EmployerMobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const prevPathRef = useRef(pathname)
  const { data: company } = useMyCompany()

  // Close sheet when pathname changes
  useEffect(() => {
    if (prevPathRef.current !== pathname && open) {
      setOpen(false)
    }
    prevPathRef.current = pathname
  }, [pathname, open])

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              {company?.name?.charAt(0) || 'C'}
            </div>
          )}
          <span className="font-semibold truncate max-w-[150px]">
            {company?.name || 'Employer'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell notificationsHref="/employer-notifications" />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64" aria-describedby={undefined}>
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <EmployerSidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background lg:hidden">
        <nav className="flex h-full items-center justify-around">
          {mobileNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
