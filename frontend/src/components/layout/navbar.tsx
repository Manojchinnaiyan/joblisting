'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'

const navItems = [
  { href: ROUTES.JOBS, label: 'Jobs' },
  { href: ROUTES.FRESHER_JOBS, label: 'Fresher Jobs' },
  { href: ROUTES.INTERNSHIPS, label: 'Internships' },
  { href: ROUTES.COMPANIES, label: 'Companies' },
  { href: '/blogs', label: 'Blog' },
  { href: ROUTES.ABOUT, label: 'About' },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
