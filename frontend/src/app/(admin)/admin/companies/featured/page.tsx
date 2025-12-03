'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  Edit,
  StarOff,
  Star,
  Building2,
  ArrowLeft,
  Shield,
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
import { useAdminCompanies, useUnfeatureCompany } from '@/hooks/admin'
import { AdminCompanyListItem } from '@/lib/api/admin/companies'

type FeaturedCompany = AdminCompanyListItem

export default function FeaturedCompaniesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<FeaturedCompany | null>(null)
  const [showUnfeatureDialog, setShowUnfeatureDialog] = useState(false)

  const { data, isLoading, isFetching } = useAdminCompanies({ is_featured: true, search: search || undefined }, { page, limit })
  const showLoading = isLoading || (!data && isFetching)
  const unfeatureCompany = useUnfeatureCompany()

  const handleUnfeature = async () => {
    if (!selectedCompany) return
    await unfeatureCompany.mutateAsync(selectedCompany.id)
    setShowUnfeatureDialog(false)
    setSelectedCompany(null)
  }

  const columns: ColumnDef<FeaturedCompany>[] = [
    getSelectColumn<FeaturedCompany>(),
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
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                {company.is_verified && (
                  <Shield className="h-4 w-4 text-blue-500" />
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
      accessorKey: 'active_jobs_count',
      header: 'Active Jobs',
      cell: ({ row }) => (
        <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300">{row.original.active_jobs_count} jobs</Badge>
      ),
    },
    {
      accessorKey: 'featured_until',
      header: 'Featured Until',
      cell: ({ row }) => {
        const date = row.original.featured_until
        if (!date) return 'Permanent'
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return 'Permanent'
          return format(d, 'MMM d, yyyy')
        } catch {
          return 'Permanent'
        }
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const company = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCompany(company)
                setShowUnfeatureDialog(true)
              }}
            >
              <StarOff className="mr-1 h-4 w-4" />
              Remove Featured
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const companies = data?.companies || []
  const pagination = data
    ? { page, limit, total: data.total, totalPages: data.total_pages }
    : undefined

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild className="flex-shrink-0 h-9 w-9">
            <Link href="/admin/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Featured Companies</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Companies highlighted on the platform</p>
          </div>
        </div>
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-lg px-4 py-2 flex-shrink-0">
          <Star className="mr-2 h-4 w-4 fill-yellow-600" />
          {data?.total || 0} featured
        </Badge>
      </div>

      {showLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          searchPlaceholder="Search featured companies..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={true}
        />
      ) : companies.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-lg">
          <Star className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Featured Companies</h3>
          <p className="text-muted-foreground mt-2">
            No companies are currently featured on the platform
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/companies">Browse Companies to Feature</Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          searchPlaceholder="Search featured companies..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={false}
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      )}

      {/* Unfeature Dialog */}
      <AlertDialog open={showUnfeatureDialog} onOpenChange={setShowUnfeatureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Featured Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedCompany?.name} from featured companies?
              They will no longer appear in prominent positions on the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnfeature}>
              Remove Featured
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
