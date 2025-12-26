'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Trash2, Database, Eye, Search, FileText, Briefcase, Activity, CheckCircle, XCircle, Loader2, Shield, Building2, MapPin, Tag, Key, Plus, Clock, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { adminCacheApi, CacheStats, CacheHealthResponse, KeyInfo } from '@/lib/api/admin/cache'
import { toast } from 'sonner'

type CacheType = 'jobs' | 'blogs' | 'search' | 'companies' | 'categories' | 'locations' | 'sessions' | 'rate-limits' | 'all'

export default function CacheManagementPage() {
  const [health, setHealth] = useState<CacheHealthResponse | null>(null)
  const [stats, setStats] = useState<CacheStats | null>(null)
  const [jobViewCounts, setJobViewCounts] = useState<Record<string, number>>({})
  const [blogViewCounts, setBlogViewCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [clearingCache, setClearingCache] = useState<CacheType | null>(null)

  // Key management state
  const [searchPattern, setSearchPattern] = useState('*')
  const [keys, setKeys] = useState<KeyInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [keyValue, setKeyValue] = useState<unknown>(null)
  const [keyType, setKeyType] = useState<string>('')
  const [keyTTL, setKeyTTL] = useState<number>(0)
  const [isLoadingKey, setIsLoadingKey] = useState(false)

  // Add key dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newTTL, setNewTTL] = useState('')
  const [isAddingKey, setIsAddingKey] = useState(false)

  const loadData = async () => {
    try {
      const [healthData, statsData, jobViews, blogViews] = await Promise.all([
        adminCacheApi.getHealth(),
        adminCacheApi.getStats().catch(() => null),
        adminCacheApi.getViewCounts('job').catch(() => ({ counts: {} })),
        adminCacheApi.getViewCounts('blog').catch(() => ({ counts: {} })),
      ])

      setHealth(healthData)
      if (statsData?.stats) {
        setStats(statsData.stats)
      }
      setJobViewCounts(jobViews.counts || {})
      setBlogViewCounts(blogViews.counts || {})
    } catch (error) {
      console.error('Failed to load cache data:', error)
      toast.error('Failed to load cache data')
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
    toast.success('Cache data refreshed')
  }

  const handleClearCache = async (type: CacheType) => {
    setClearingCache(type)
    try {
      let result
      switch (type) {
        case 'jobs':
          result = await adminCacheApi.clearJobCache()
          break
        case 'blogs':
          result = await adminCacheApi.clearBlogCache()
          break
        case 'search':
          result = await adminCacheApi.clearSearchCache()
          break
        case 'companies':
          result = await adminCacheApi.clearCompanyCache()
          break
        case 'categories':
          result = await adminCacheApi.clearCategoryCache()
          break
        case 'locations':
          result = await adminCacheApi.clearLocationCache()
          break
        case 'sessions':
          result = await adminCacheApi.clearSessionCache()
          break
        case 'rate-limits':
          result = await adminCacheApi.clearRateLimits()
          break
        case 'all':
          result = await adminCacheApi.clearAllCache()
          break
      }
      toast.success(result.message)
      await loadData()
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error('Failed to clear cache')
    } finally {
      setClearingCache(null)
    }
  }

  const handleSearchKeys = async () => {
    setIsSearching(true)
    try {
      const result = await adminCacheApi.searchKeys(searchPattern, 100)
      setKeys(result.keys || [])
    } catch (error) {
      console.error('Failed to search keys:', error)
      toast.error('Failed to search keys')
    } finally {
      setIsSearching(false)
    }
  }

  const handleViewKey = async (key: string) => {
    setSelectedKey(key)
    setIsLoadingKey(true)
    try {
      const result = await adminCacheApi.getKey(key)
      setKeyValue(result.value)
      setKeyType(result.type)
      setKeyTTL(result.ttl)
    } catch (error) {
      console.error('Failed to get key:', error)
      toast.error('Failed to get key value')
      setSelectedKey(null)
    } finally {
      setIsLoadingKey(false)
    }
  }

  const handleDeleteKey = async (key: string) => {
    try {
      await adminCacheApi.deleteKey(key)
      toast.success('Key deleted successfully')
      setKeys(keys.filter(k => k.key !== key))
      if (selectedKey === key) {
        setSelectedKey(null)
        setKeyValue(null)
      }
    } catch (error) {
      console.error('Failed to delete key:', error)
      toast.error('Failed to delete key')
    }
  }

  const handleAddKey = async () => {
    if (!newKey || !newValue) {
      toast.error('Key and value are required')
      return
    }
    setIsAddingKey(true)
    try {
      await adminCacheApi.setKey({
        key: newKey,
        value: newValue,
        ttl: newTTL ? parseInt(newTTL) : undefined,
      })
      toast.success('Key added successfully')
      setShowAddDialog(false)
      setNewKey('')
      setNewValue('')
      setNewTTL('')
      // Refresh key list
      handleSearchKeys()
    } catch (error) {
      console.error('Failed to add key:', error)
      toast.error('Failed to add key')
    } finally {
      setIsAddingKey(false)
    }
  }

  const formatTTL = (ttl: number): string => {
    if (ttl === -1) return 'No expiry'
    if (ttl === -2) return 'Key not found'
    if (ttl < 60) return `${ttl}s`
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}m`
    return `${Math.floor(ttl / 86400)}d ${Math.floor((ttl % 86400) / 3600)}h`
  }

  const formatValue = (value: unknown): string => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return value
      }
    }
    return JSON.stringify(value, null, 2)
  }

  if (isLoading) {
    return <CacheSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Cache Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Monitor and manage Redis cache</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/cache/blocked-ips">
              <Globe className="mr-2 h-4 w-4" />
              Blocked IPs
            </Link>
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cache Status
            </CardTitle>
            <Badge variant={health?.available ? 'default' : 'destructive'} className="flex items-center gap-1">
              {health?.available ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Healthy
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Unavailable
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards - Grid Layout */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Keys</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_keys ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.job_cache ?? 0) + (stats.job_list_cache ?? 0)}</div>
              <p className="text-xs text-muted-foreground">{stats.job_cache ?? 0} items, {stats.job_list_cache ?? 0} lists</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blogs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.blog_cache ?? 0) + (stats.blog_list_cache ?? 0)}</div>
              <p className="text-xs text-muted-foreground">{stats.blog_cache ?? 0} items, {stats.blog_list_cache ?? 0} lists</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.company_cache ?? 0) + (stats.company_list_cache ?? 0)}</div>
              <p className="text-xs text-muted-foreground">{stats.company_cache ?? 0} items, {stats.company_list_cache ?? 0} lists</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.category_cache ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.location_cache ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Search</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.search_cache ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.view_counters ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.sessions ?? 0) + (stats.user_sessions ?? 0)}</div>
              <p className="text-xs text-muted-foreground">{stats.sessions ?? 0} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rate Limits</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rate_limits ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cache Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Operations</CardTitle>
          <CardDescription>Clear specific cache types or all caches</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { type: 'jobs' as CacheType, label: 'Jobs', icon: Briefcase, description: 'Clear all cached job data' },
              { type: 'blogs' as CacheType, label: 'Blogs', icon: FileText, description: 'Clear all cached blog data' },
              { type: 'companies' as CacheType, label: 'Companies', icon: Building2, description: 'Clear all cached company data' },
              { type: 'categories' as CacheType, label: 'Categories', icon: Tag, description: 'Clear all cached category data' },
              { type: 'locations' as CacheType, label: 'Locations', icon: MapPin, description: 'Clear all cached location data' },
              { type: 'search' as CacheType, label: 'Search', icon: Search, description: 'Clear all cached search results' },
              { type: 'sessions' as CacheType, label: 'Sessions', icon: Users, description: 'Clear all user sessions (logs everyone out)' },
              { type: 'rate-limits' as CacheType, label: 'Rate Limits', icon: Shield, description: 'Clear all rate limit counters' },
            ].map(({ type, label, icon: Icon, description }) => (
              <AlertDialog key={type}>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={clearingCache !== null}>
                    {clearingCache === type ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="mr-2 h-4 w-4" />
                    )}
                    Clear {label}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear {label} Cache?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {description}. Data will be re-cached on next access.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleClearCache(type)}>Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={clearingCache !== null}>
                  {clearingCache === 'all' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Clear All Caches
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Caches?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will clear all cached data including jobs, blogs, companies, search results, and view counters.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleClearCache('all')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Key Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Key Management
              </CardTitle>
              <CardDescription>Search, view, add, and delete cache keys</CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search pattern (e.g., job:*, category:*, *)"
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchKeys()}
              />
            </div>
            <Button onClick={handleSearchKeys} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>

          {keys.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Keys List */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>TTL</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((keyInfo) => (
                      <TableRow
                        key={keyInfo.key}
                        className={selectedKey === keyInfo.key ? 'bg-muted' : 'cursor-pointer hover:bg-muted/50'}
                        onClick={() => handleViewKey(keyInfo.key)}
                      >
                        <TableCell className="font-mono text-xs truncate max-w-[200px]" title={keyInfo.key}>
                          {keyInfo.key}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{keyInfo.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTTL(keyInfo.ttl)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Key?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the key &quot;{keyInfo.key}&quot;? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteKey(keyInfo.key)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Key Value Viewer */}
              <div className="border rounded-lg p-4">
                {isLoadingKey ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedKey ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Key</Label>
                      <p className="font-mono text-sm break-all">{selectedKey}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <p><Badge variant="outline">{keyType}</Badge></p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">TTL</Label>
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTTL(keyTTL)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Value</Label>
                      <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-[300px]">
                        {formatValue(keyValue)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a key to view its value
                  </div>
                )}
              </div>
            </div>
          )}

          {keys.length === 0 && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              Search for keys using a pattern (e.g., job:*, category:*, *)
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Counts */}
      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Job View Counts ({Object.keys(jobViewCounts).length})</TabsTrigger>
          <TabsTrigger value="blogs">Blog View Counts ({Object.keys(blogViewCounts).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Job View Counts</CardTitle>
              <CardDescription>
                View counts waiting to be synced to the database (syncs every 5 minutes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(jobViewCounts).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pending view counts</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead className="text-right">Pending Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(jobViewCounts).map(([id, count]) => (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-sm">{id}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blogs" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Blog View Counts</CardTitle>
              <CardDescription>
                View counts waiting to be synced to the database (syncs every 5 minutes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(blogViewCounts).length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pending view counts</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Blog ID</TableHead>
                      <TableHead className="text-right">Pending Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(blogViewCounts).map(([id, count]) => (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-sm">{id}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{count}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Key Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cache Key</DialogTitle>
            <DialogDescription>
              Add a new key-value pair to the cache. Value should be a string or valid JSON.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                placeholder="e.g., custom:mykey"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Textarea
                id="value"
                placeholder="Enter value (string or JSON)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ttl">TTL (seconds)</Label>
              <Input
                id="ttl"
                type="number"
                placeholder="Leave empty for no expiry"
                value={newTTL}
                onChange={(e) => setNewTTL(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Time to live in seconds. Leave empty for no expiry.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKey} disabled={isAddingKey}>
              {isAddingKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CacheSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-1" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <Skeleton className="h-20 w-full" />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
