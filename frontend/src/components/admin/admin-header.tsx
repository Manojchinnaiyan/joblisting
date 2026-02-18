'use client'

import { useState } from 'react'
import { Menu, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { AdminSidebar } from './sidebar'
import { useAdminAuthStore } from '@/store/admin-auth-store'
import { useAdminLogout } from '@/hooks/admin/use-admin-auth'
import Link from 'next/link'

interface AdminHeaderProps {
  title?: string
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { user } = useAdminAuthStore()
  const { mutate: logout } = useAdminLogout()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900">
      {/* Mobile menu */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 h-full">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Admin panel navigation sidebar</SheetDescription>
          </VisuallyHidden>
          <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Title */}
      {title && <h1 className="text-lg font-semibold md:text-xl">{title}</h1>}

      {/* Search */}
      <div className="flex-1">
        <form className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full max-w-sm bg-muted pl-8"
            />
          </div>
        </form>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
              <User className="h-5 w-5" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <DropdownMenuLabel className="text-slate-900 dark:text-white">
              <div className="flex flex-col">
                <span>
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
            <DropdownMenuItem asChild className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">
              <Link href="/admin/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">
              <Link href="/admin/profile/2fa">2FA Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
            <DropdownMenuItem onClick={() => logout()} className="text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
