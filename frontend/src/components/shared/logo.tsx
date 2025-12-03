'use client'

import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { APP_NAME, ROUTES } from '@/lib/constants'
import { useAuthStore } from '@/store/auth-store'

export function Logo() {
  const { isAuthenticated } = useAuthStore()
  const homeRoute = isAuthenticated ? ROUTES.DASHBOARD : ROUTES.HOME

  return (
    <Link href={homeRoute} className="flex items-center space-x-2">
      <Briefcase className="h-6 w-6 text-primary" />
      <span className="font-bold text-xl">{APP_NAME}</span>
    </Link>
  )
}
