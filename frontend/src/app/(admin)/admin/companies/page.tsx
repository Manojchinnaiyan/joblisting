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
  Star,
  StarOff,
  Building2,
  Shield,
  Clock,
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
  useAdminCompanies,
  useVerifyCompany,
  useFeatureCompany,
  useUnfeatureCompany,
  useSuspendCompany,
  useDeleteCompany,
} from '@/hooks/admin'
import { AdminCompanyListItem } from '@/lib/api/admin/companies'

type Company = AdminCompanyListItem

export default function CompaniesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [actionDialog, setActionDialog] = useState<
    'verify' | 'feature' | 'unfeature' | 'suspend' | 'delete' | null
  >(null)

  const { data, isLoading } = useAdminCompanies({ search: search || undefined }, { page, limit })
  const verifyCompany = useVerifyCompany()
  const featureCompany = useFeatureCompany()
  const unfeatureCompany = useUnfeatureCompany()
  const suspendCompany = useSuspendCompany()
  const deleteCompany = useDeleteCompany()

  const handleAction = async () => {
    if (!selectedCompany) return

    try {
      switch (actionDialog) {
        case 'verify':
          await verifyCompany.mutateAsync(selectedCompany.id)
          break
        case 'feature':
          await featureCompany.mutateAsync({ id: selectedCompany.id })
          break
        case 'unfeature':
          await unfeatureCompany.mutateAsync(selectedCompany.id)
          break
        case 'suspend':
          await suspendCompany.mutateAsync({ id: selectedCompany.id })
          break
        case 'delete':
          await deleteCompany.mutateAsync(selectedCompany.id)
          break
      }
    } finally {
      setActionDialog(null)
      setSelectedCompany(null)
    }
  }

  const columns: ColumnDef<Company>[] = [
    getSelectColumn<Company>(),
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={company.logo_url} />
              <AvatarFallback>
                {company.name?.charAt(0)?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/companies/${company.id}`}
                  className="font-medium hover:underline"
                >
                  {company.name}
                </Link>
                {company.is_verified && (
                  <Shield className="h-4 w-4 text-blue-500" />
                )}
                {company.is_featured && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">{company.industry || 'No industry'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      cell: ({ row }) => row.original.industry || '-',
    },
    {
      accessorKey: 'company_size',
      header: 'Size',
      cell: ({ row }) => row.original.company_size || '-',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const { status, is_verified } = row.original
        if (status === 'PENDING') {
          return (
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Pending
            </Badge>
          )
        }
        if (status === 'SUSPENDED') {
          return <Badge variant="destructive">Suspended</Badge>
        }
        return (
          <Badge
            className={
              is_verified
                ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100'
            }
          >
            {is_verified ? 'Verified' : 'Unverified'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'active_jobs_count',
      header: 'Jobs',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{row.original.active_jobs_count} jobs</Badge>
      ),
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => {
        const owner = row.original.owner
        if (!owner) return '-'
        return (
          <Link
            href={`/admin/users/${owner.id}`}
            className="text-sm hover:underline"
          >
            {owner.first_name} {owner.last_name}
          </Link>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
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
      id: 'actions',
      cell: ({ row }) => {
        const company = row.original
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
                <Link href={`/admin/companies/${company.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/companies/${company.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Company
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!company.is_verified && (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCompany(company)
                    setActionDialog('verify')
                  }}
                  className="text-blue-600"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Company
                </DropdownMenuItem>
              )}
              {company.is_featured ? (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCompany(company)
                    setActionDialog('unfeature')
                  }}
                >
                  <StarOff className="mr-2 h-4 w-4" />
                  Remove Featured
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCompany(company)
                    setActionDialog('feature')
                  }}
                  className="text-yellow-600"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Mark as Featured
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {company.status !== 'SUSPENDED' ? (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCompany(company)
                    setActionDialog('suspend')
                  }}
                  className="text-orange-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Company
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedCompany(company)
                    setActionDialog('verify')
                  }}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Reactivate
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setSelectedCompany(company)
                  setActionDialog('delete')
                }}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Company
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const companies = data?.companies || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Companies</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage all registered companies</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/companies/pending">
              <Clock className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Pending Verification</span>
              <span className="xs:hidden">Pending</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/companies/featured">
              <Star className="mr-2 h-4 w-4" />
              Featured
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={companies}
        searchPlaceholder="Search companies..."
        searchValue={search}
        onSearch={(value) => {
          setSearch(value)
          setPage(1)
        }}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={setPage}
        onLimitChange={setLimit}
        enableExport
        onExport={() => console.log('Export companies')}
      />

      {/* Verify Dialog */}
      <AlertDialog open={actionDialog === 'verify'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {selectedCompany?.name}? This will mark the company
              as verified and display a verification badge on their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Verify Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feature Dialog */}
      <AlertDialog open={actionDialog === 'feature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Feature Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to feature {selectedCompany?.name}? Featured companies appear
              prominently on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Feature Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unfeature Dialog */}
      <AlertDialog open={actionDialog === 'unfeature'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the featured status from {selectedCompany?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>
              Remove Featured
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog open={actionDialog === 'suspend'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to suspend {selectedCompany?.name}? All their job listings will
              be hidden and they won&apos;t be able to post new jobs until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Suspend Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCompany?.name}? This action cannot be undone.
              All company data, job listings, and associated information will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
