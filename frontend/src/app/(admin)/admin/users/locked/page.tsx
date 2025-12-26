'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Unlock,
  AlertTriangle,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable } from '@/components/admin/data-table'
import {
  useAdminUsers,
  useUnlockUser,
} from '@/hooks/admin'
import { AdminUserListItem } from '@/lib/api/admin/users'

type User = AdminUserListItem

export default function LockedUsersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUnlockDialog, setShowUnlockDialog] = useState(false)

  // Fetch all users and filter for locked ones
  const { data, isLoading, refetch, isFetching } = useAdminUsers({}, { page, limit: 100 })
  const unlockUser = useUnlockUser()

  // Filter for locked users (failed_login_attempts >= 5)
  const lockedUsers = (data?.users || []).filter(user => user.failed_login_attempts >= 5)

  const handleUnlock = async () => {
    if (!selectedUser) return

    try {
      await unlockUser.mutateAsync(selectedUser.id)
    } finally {
      setShowUnlockDialog(false)
      setSelectedUser(null)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'user',
      header: 'User',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profile?.avatar_url} />
              <AvatarFallback>
                {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/admin/users/${user.id}`}
                className="font-medium hover:underline"
              >
                {user.first_name} {user.last_name}
              </Link>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role
        const roleStyles: Record<string, string> = {
          ADMIN: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-100',
          EMPLOYER: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100',
          JOB_SEEKER: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-100',
        }
        const roleLabels: Record<string, string> = {
          JOB_SEEKER: 'Job Seeker',
          EMPLOYER: 'Employer',
          ADMIN: 'Admin',
        }
        return (
          <Badge variant="outline" className={roleStyles[role] || ''}>
            {roleLabels[role] || role}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'failed_login_attempts',
      header: 'Failed Attempts',
      cell: ({ row }) => {
        const attempts = row.original.failed_login_attempts
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" />
            {attempts} attempts
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Account Status',
      cell: ({ row }) => {
        const status = row.original.status
        return (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                status === 'ACTIVE'
                  ? 'default'
                  : status === 'SUSPENDED'
                  ? 'destructive'
                  : 'secondary'
              }
              className={
                status === 'ACTIVE'
                  ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
                  : ''
              }
            >
              {status === 'ACTIVE' ? 'Active' : status === 'SUSPENDED' ? 'Suspended' : 'Pending'}
            </Badge>
            <Badge variant="destructive" className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Locked
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'last_login_at',
      header: 'Last Login Attempt',
      cell: ({ row }) => {
        const date = row.original.last_login_at
        if (!date) return 'Never'
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return 'Never'
          return format(d, 'MMM d, yyyy HH:mm')
        } catch {
          return 'Never'
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                setSelectedUser(user)
                setShowUnlockDialog(true)
              }}
            >
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/users/${user.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              Locked Users
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Users locked due to too many failed login attempts ({lockedUsers.length} users)
            </p>
          </div>
        </div>
      </div>

      {lockedUsers.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-green-100 p-4 dark:bg-green-900">
            <Unlock className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No Locked Users</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            All user accounts are currently accessible. Users get locked after 5 failed login attempts.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/users">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Users
            </Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={lockedUsers}
          isLoading={isLoading}
          onRefresh={() => refetch()}
          isRefreshing={isFetching && !isLoading}
        />
      )}

      {/* Unlock Dialog */}
      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlock User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlock the account for <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong>?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reset their failed login attempts ({selectedUser?.failed_login_attempts} → 0)</li>
                <li>Remove any temporary lockout</li>
                <li>Allow them to log in immediately</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlock}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Unlock className="mr-2 h-4 w-4" />
              Unlock Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
