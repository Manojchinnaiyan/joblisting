'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Mail,
  UserPlus,
  Shield,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { DataTable, getSelectColumn } from '@/components/admin/data-table'
import {
  useAdminUsers,
  useSuspendUser,
  useActivateUser,
  useDeleteUser,
} from '@/hooks/admin'
import { AdminUserListItem } from '@/lib/api/admin/users'

type AdminUser = AdminUserListItem

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [actionDialog, setActionDialog] = useState<'suspend' | 'activate' | 'delete' | null>(null)

  const { data, isLoading } = useAdminUsers({ role: 'ADMIN', search: search || undefined }, { page, limit })
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()
  const deleteUser = useDeleteUser()

  const handleAction = async () => {
    if (!selectedUser) return

    try {
      switch (actionDialog) {
        case 'suspend':
          await suspendUser.mutateAsync({ id: selectedUser.id })
          break
        case 'activate':
          await activateUser.mutateAsync(selectedUser.id)
          break
        case 'delete':
          await deleteUser.mutateAsync(selectedUser.id)
          break
      }
    } finally {
      setActionDialog(null)
      setSelectedUser(null)
    }
  }

  const columns: ColumnDef<AdminUser>[] = [
    getSelectColumn<AdminUser>(),
    {
      accessorKey: 'user',
      header: 'Administrator',
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const statusStyles: Record<string, string> = {
          ACTIVE: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100',
          SUSPENDED: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100',
          PENDING: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100',
        }
        return (
          <Badge variant="outline" className={statusStyles[status] || ''}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Unknown'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'is_2fa_enabled',
      header: '2FA Status',
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={
            row.original.is_2fa_enabled
              ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
          }
        >
          <ShieldCheck className="mr-1 h-3 w-3" />
          {row.original.is_2fa_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      accessorKey: 'permissions',
      header: 'Permissions',
      cell: ({ row }) => {
        const permissions = row.original.permissions || ['Full Access']
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.slice(0, 2).map((perm) => (
              <Badge key={perm} variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                {perm}
              </Badge>
            ))}
            {permissions.length > 2 && (
              <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">
                +{permissions.length - 2} more
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Added',
      cell: ({ row }) => {
        const date = row.original.created_at
        if (!date) return '-'
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return '-'
          return format(d, 'MMM d, yyyy')
        } catch {
          return '-'
        }
      },
    },
    {
      accessorKey: 'last_login',
      header: 'Last Active',
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
              <DropdownMenuItem asChild>
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Admin
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={`mailto:${user.email}`}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === 'ACTIVE' ? (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(user)
                    setActionDialog('suspend')
                  }}
                  className="text-orange-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Admin
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedUser(user)
                    setActionDialog('activate')
                  }}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(user)
                  setActionDialog('delete')
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const users = data?.users || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Admin Users</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage administrator accounts and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users">
              <Shield className="mr-2 h-4 w-4" />
              All Users
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/users/admins/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Admin
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchPlaceholder="Search administrators..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {/* Suspend Dialog */}
      <AlertDialog open={actionDialog === 'suspend'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {selectedUser?.first_name} {selectedUser?.last_name}?
              They will lose access to the admin panel until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Suspend Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog open={actionDialog === 'activate'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to activate {selectedUser?.first_name} {selectedUser?.last_name}?
              They will regain access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-green-600 hover:bg-green-700"
            >
              Activate Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Administrator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedUser?.first_name} {selectedUser?.last_name} as an administrator?
              This will revoke all admin privileges. The user account will remain but with standard user access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remove Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
