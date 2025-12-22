'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Briefcase, Building2, Info, Home, BookOpen, Users, Search, GraduationCap, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ROUTES, APP_NAME } from '@/lib/constants'
import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'

const navItems = [
  { href: ROUTES.HOME, label: 'Home', icon: Home },
  { href: ROUTES.JOBS, label: 'Jobs', icon: Briefcase },
  { href: ROUTES.FRESHER_JOBS, label: 'Fresher Jobs', icon: GraduationCap },
  { href: ROUTES.INTERNSHIPS, label: 'Internships', icon: UserCheck },
  { href: ROUTES.COMPANIES, label: 'Companies', icon: Building2 },
  { href: '/blogs', label: 'Blog', icon: BookOpen },
  { href: ROUTES.ABOUT, label: 'About', icon: Info },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const prevPathRef = useRef(pathname)
  const { isAuthenticated } = useAuthStore()

  // Close sheet when pathname changes (after navigation completes)
  useEffect(() => {
    if (prevPathRef.current !== pathname && open) {
      setOpen(false)
    }
    prevPathRef.current = pathname
  }, [pathname, open])

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Toggle menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64 p-0" aria-describedby={undefined}>
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <Link href={ROUTES.HOME} onClick={() => setOpen(false)} className="text-xl font-bold">
                {APP_NAME}
              </Link>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== ROUTES.HOME && pathname.startsWith(item.href))
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}

              {!isAuthenticated && (
                <>
                  <Separator className="my-4" />
                  <Link
                    href="/register?role=employer"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Users className="h-5 w-5" />
                    Hire Talent
                  </Link>
                  <Link
                    href={ROUTES.JOBS}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Search className="h-5 w-5" />
                    Find a Job
                  </Link>
                </>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
