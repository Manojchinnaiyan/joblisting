'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  RefreshCw,
  Unlock,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Globe,
  Clock,
  Activity,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { adminCacheApi, RateLimitInfo } from '@/lib/api/admin/cache'
import { toast } from 'sonner'

export default function BlockedIPsPage() {
  const [rateLimits, setRateLimits] = useState<RateLimitInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchIP, setSearchIP] = useState('')
  const [selectedIP, setSelectedIP] = useState<string | null>(null)
  const [showUnblockDialog, setShowUnblockDialog] = useState(false)
  const [isUnblocking, setIsUnblocking] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)

  const loadData = async () => {
    try {
      const response = await adminCacheApi.getRateLimits()
      setRateLimits(response.rate_limits || [])
    } catch (error) {
      console.error('Failed to load rate limits:', error)
      toast.error('Failed to load rate limits')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
    toast.success('Rate limits refreshed')
  }

  const handleUnblock = async () => {
    if (!selectedIP) return

    setIsUnblocking(true)
    try {
      await adminCacheApi.clearRateLimits(selectedIP)
      toast.success(`Unblocked IP: ${selectedIP}`)
      await loadData()
    } catch (error) {
      console.error('Failed to unblock IP:', error)
      toast.error('Failed to unblock IP')
    } finally {
      setIsUnblocking(false)
      setShowUnblockDialog(false)
      setSelectedIP(null)
    }
  }

  const handleClearAll = async () => {
    setIsUnblocking(true)
    try {
      await adminCacheApi.clearRateLimits()
      toast.success('All rate limits cleared')
      await loadData()
    } catch (error) {
      console.error('Failed to clear rate limits:', error)
      toast.error('Failed to clear rate limits')
    } finally {
      setIsUnblocking(false)
      setShowClearAllDialog(false)
    }
  }

  const formatTTL = (seconds: number) => {
    if (seconds < 0) return 'No expiry'
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  // Filter and sort rate limits
  const filteredLimits = rateLimits
    .filter(rl =>
      searchIP === '' ||
      rl.ip.toLowerCase().includes(searchIP.toLowerCase()) ||
      rl.endpoint.toLowerCase().includes(searchIP.toLowerCase())
    )
    .sort((a, b) => {
      // Blocked first, then by count descending
      if (a.is_blocked !== b.is_blocked) return a.is_blocked ? -1 : 1
      return b.count - a.count
    })

  const blockedCount = rateLimits.filter(rl => rl.is_blocked).length
  const totalCount = rateLimits.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/cache">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">Rate Limits & Blocked IPs</h1>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/cache">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-orange-500" />
              Rate Limits & Blocked IPs
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage IP rate limits and unblock restricted addresses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {totalCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearAllDialog(true)}
            >
              Clear All Limits
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rate Limits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{blockedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Limits</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount - blockedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {blockedCount === 0 ? 'Clear' : 'Active'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limited IPs</CardTitle>
          <CardDescription>
            IPs that have hit rate limits. Blocked IPs cannot make requests until the TTL expires or they are manually unblocked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search by IP or endpoint..."
              value={searchIP}
              onChange={(e) => setSearchIP(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredLimits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-green-100 p-4 dark:bg-green-900">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No Rate Limits Active</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                {searchIP ? 'No rate limits match your search.' : 'All IPs are currently unrestricted.'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Request Count</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLimits.map((rl) => (
                    <TableRow key={rl.key}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          {rl.ip}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rl.endpoint}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={rl.is_blocked ? 'text-destructive font-semibold' : ''}>
                          {rl.count} / 5
                        </span>
                      </TableCell>
                      <TableCell>
                        {rl.is_blocked ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3" />
                            Blocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Rate Limited</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">{formatTTL(rl.ttl)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={rl.is_blocked ? 'default' : 'outline'}
                          size="sm"
                          className={rl.is_blocked ? 'bg-blue-600 hover:bg-blue-700' : ''}
                          onClick={() => {
                            setSelectedIP(rl.ip)
                            setShowUnblockDialog(true)
                          }}
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unblock Dialog */}
      <AlertDialog open={showUnblockDialog} onOpenChange={setShowUnblockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock <strong className="font-mono">{selectedIP}</strong>?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reset all rate limit counters for this IP</li>
                <li>Allow the IP to make requests immediately</li>
                <li>Remove any temporary blocks</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblock}
              disabled={isUnblocking}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUnblocking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Unblocking...
                </>
              ) : (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Unblock IP
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Rate Limits</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear ALL rate limits?
              <br /><br />
              This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reset all IP rate limit counters</li>
                <li>Unblock all currently blocked IPs ({blockedCount} blocked)</li>
                <li>Allow all IPs to make requests immediately</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnblocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              disabled={isUnblocking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUnblocking ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear All Limits'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
