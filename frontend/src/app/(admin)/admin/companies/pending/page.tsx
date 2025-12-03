'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  ExternalLink,
  ArrowLeft,
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { DataTable, getSelectColumn } from '@/components/admin/data-table'
import {
  useAdminCompanies,
  useVerifyCompany,
  useRejectCompany,
} from '@/hooks/admin'

interface PendingCompany {
  id: string
  name: string
  slug: string
  logo_url?: string
  industry?: string
  size?: string
  location?: string
  website?: string
  owner?: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
}

export default function PendingCompaniesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<PendingCompany | null>(null)
  const [actionDialog, setActionDialog] = useState<'verify' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isFetching } = useAdminCompanies({ status: 'PENDING', search: search || undefined }, { page, limit })
  const showLoading = isLoading || (!data && isFetching)
  const verifyCompany = useVerifyCompany()
  const rejectCompany = useRejectCompany()

  const handleVerify = async () => {
    if (!selectedCompany) return
    await verifyCompany.mutateAsync(selectedCompany.id)
    setActionDialog(null)
    setSelectedCompany(null)
  }

  const handleReject = async () => {
    if (!selectedCompany) return
    await rejectCompany.mutateAsync({ id: selectedCompany.id, reason: rejectReason })
    setActionDialog(null)
    setSelectedCompany(null)
    setRejectReason('')
  }

  const columns: ColumnDef<PendingCompany>[] = [
    getSelectColumn<PendingCompany>(),
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
              <Link
                href={`/admin/companies/${company.id}`}
                className="font-medium hover:underline"
              >
                {company.name}
              </Link>
              <p className="text-sm text-muted-foreground">{company.industry || 'No industry'}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: ({ row }) => row.original.location || '-',
    },
    {
      accessorKey: 'size',
      header: 'Size',
      cell: ({ row }) => row.original.size || '-',
    },
    {
      accessorKey: 'owner',
      header: 'Submitted By',
      cell: ({ row }) => {
        const owner = row.original.owner
        if (!owner) return '-'
        return (
          <div>
            <Link
              href={`/admin/users/${owner.id}`}
              className="text-sm hover:underline"
            >
              {owner.first_name} {owner.last_name}
            </Link>
            <p className="text-xs text-muted-foreground">{owner.email}</p>
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Submitted',
      cell: ({ row }) => {
        const date = row.original.created_at
        let formatted = '-'
        if (date) {
          try {
            const d = new Date(date)
            if (!isNaN(d.getTime())) {
              formatted = format(d, 'MMM d, yyyy')
            }
          } catch {
            // Keep default
          }
        }
        return (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {formatted}
          </div>
        )
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
              className="text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => {
                setSelectedCompany(company)
                setActionDialog('verify')
              }}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Verify
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedCompany(company)
                setActionDialog('reject')
              }}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Reject
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
                {company.website && (
                  <DropdownMenuItem asChild>
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Website
                    </a>
                  </DropdownMenuItem>
                )}
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
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Pending Verifications</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Review and verify company registrations</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 flex-shrink-0">
          {data?.total || 0} pending
        </Badge>
      </div>

      {showLoading ? (
        <DataTable
          columns={columns}
          data={[]}
          searchPlaceholder="Search pending companies..."
          searchValue={search}
          onSearch={(value) => {
            setSearch(value)
            setPage(1)
          }}
          isLoading={true}
        />
      ) : companies.length === 0 && !search ? (
        <div className="flex flex-col items-center justify-center py-12 bg-card border rounded-lg">
          <Building2 className="h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Pending Verifications</h3>
          <p className="text-muted-foreground mt-2">
            All company verifications have been processed
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/companies">View All Companies</Link>
          </Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          searchPlaceholder="Search pending companies..."
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

      {/* Verify Dialog */}
      <AlertDialog open={actionDialog === 'verify'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {selectedCompany?.name}? This will approve the
              company registration and display a verification badge on their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerify}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={actionDialog === 'reject'} onOpenChange={() => setActionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Company Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {selectedCompany?.name}&apos;s registration.
              This will be sent to the company owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reject-reason">Rejection Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Please provide details about why this registration is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
