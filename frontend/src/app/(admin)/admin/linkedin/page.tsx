'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Loader2,
  Save,
  Unplug,
  Linkedin,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useLinkedInStatus,
  useLinkedInPosts,
  useLinkedInSettings,
  useDisconnectLinkedIn,
  usePostCustomToLinkedIn,
  useUpdateLinkedInSettings,
} from '@/hooks/admin/use-admin-linkedin'
import { adminLinkedInApi } from '@/lib/api/admin/linkedin'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

const autoPostSchema = z.object({
  auto_post_jobs: z.boolean(),
  auto_post_blogs: z.boolean(),
})

type AutoPostValues = z.infer<typeof autoPostSchema>

export default function LinkedInPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toastShown = useRef(false)

  useEffect(() => {
    if (toastShown.current) return
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      toastShown.current = true
      toast.success('LinkedIn connected successfully!')
      router.replace('/admin/linkedin')
    } else if (error) {
      toastShown.current = true
      const messages: Record<string, string> = {
        missing_code: 'Authorization code was missing from LinkedIn response.',
        callback_failed: 'Failed to connect LinkedIn. Please try again.',
        user_cancelled_authorize: 'LinkedIn authorization was cancelled.',
      }
      toast.error(messages[error] || `LinkedIn connection error: ${error}`)
      router.replace('/admin/linkedin')
    }
  }, [searchParams, router])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LinkedIn Integration</h1>
        <p className="text-muted-foreground">
          Manage your LinkedIn company page connection and automated posting.
        </p>
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection">Connection</TabsTrigger>
          <TabsTrigger value="autopost">Auto-Post</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <ConnectionTab />
        </TabsContent>
        <TabsContent value="autopost">
          <AutoPostTab />
        </TabsContent>
        <TabsContent value="compose">
          <ComposeTab />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ConnectionTab() {
  const { data: status, isLoading } = useLinkedInStatus()
  const { mutate: disconnect, isPending: isDisconnecting } = useDisconnectLinkedIn()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      const { auth_url } = await adminLinkedInApi.getAuthURL()
      window.location.href = auth_url
    } catch {
      toast.error('Failed to get LinkedIn authorization URL')
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5 text-[#0A66C2]" />
          LinkedIn Connection
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn company page to enable automated posting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Connected</p>
                <p className="text-sm text-green-700">
                  {status.organization_name || 'LinkedIn Company Page'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Organization ID</p>
                <p className="text-sm font-medium">{status.organization_id}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Token Expires</p>
                <p className="text-sm font-medium">
                  {status.expires_at
                    ? formatDistanceToNow(new Date(status.expires_at), {
                        addSuffix: true,
                      })
                    : 'Unknown'}
                </p>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => disconnect()}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unplug className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <XCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Not Connected</p>
                <p className="text-sm text-amber-700">
                  Connect your LinkedIn company page to start posting.
                </p>
              </div>
            </div>

            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Linkedin className="mr-2 h-4 w-4" />
              )}
              Connect LinkedIn
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AutoPostTab() {
  const { data: settings, isLoading } = useLinkedInSettings()
  const { mutate: updateSettings, isPending } = useUpdateLinkedInSettings()

  const form = useForm<AutoPostValues>({
    resolver: zodResolver(autoPostSchema),
    values: {
      auto_post_jobs: settings?.auto_post_jobs ?? false,
      auto_post_blogs: settings?.auto_post_blogs ?? false,
    },
  })

  const onSubmit = (values: AutoPostValues) => {
    updateSettings(values)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Post Settings</CardTitle>
        <CardDescription>
          Configure automatic posting to LinkedIn when content is published.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="auto_post_jobs"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-post Jobs</FormLabel>
                    <FormDescription>
                      Automatically post to LinkedIn when a job is approved.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auto_post_blogs"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto-post Blogs</FormLabel>
                    <FormDescription>
                      Automatically post to LinkedIn when a blog is published.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function ComposeTab() {
  const { data: status } = useLinkedInStatus()
  const { mutate: postCustom, isPending } = usePostCustomToLinkedIn()
  const [text, setText] = useState('')
  const [link, setLink] = useState('')

  const handlePost = () => {
    if (!text.trim()) {
      toast.error('Post text is required')
      return
    }
    postCustom(
      { text: text.trim(), link: link.trim() || undefined },
      {
        onSuccess: () => {
          setText('')
          setLink('')
        },
      }
    )
  }

  const charCount = text.length
  const maxChars = 3000

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Post</CardTitle>
        <CardDescription>
          Create and publish a custom post to your LinkedIn company page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!status?.connected && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Connect your LinkedIn account first to compose posts.
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Post Content</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your LinkedIn post here..."
            rows={6}
            maxLength={maxChars}
            disabled={!status?.connected}
          />
          <p
            className={`text-xs ${
              charCount > maxChars * 0.9 ? 'text-red-500' : 'text-muted-foreground'
            }`}
          >
            {charCount} / {maxChars} characters
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Link (optional)</label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://jobsworld.in/..."
            type="url"
            disabled={!status?.connected}
          />
          <p className="text-xs text-muted-foreground">
            Add a URL to create a rich link preview card on LinkedIn.
          </p>
        </div>

        <Button
          onClick={handlePost}
          disabled={isPending || !status?.connected || !text.trim()}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Post to LinkedIn
        </Button>
      </CardContent>
    </Card>
  )
}

function HistoryTab() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useLinkedInPosts({ page, limit: 20 })

  const statusBadge = (status: string) => {
    switch (status) {
      case 'posted':
        return <Badge className="bg-green-100 text-green-800">Posted</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const typeBadge = (type: string) => {
    switch (type) {
      case 'job':
        return <Badge variant="outline">Job</Badge>
      case 'blog':
        return <Badge variant="outline">Blog</Badge>
      case 'custom':
        return <Badge variant="outline">Custom</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const posts = data?.posts || []
  const total = data?.total || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post History</CardTitle>
        <CardDescription>
          {total} total posts to LinkedIn.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No posts yet. Start posting to see history here.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeBadge(post.content_type)}
                    {statusBadge(post.status)}
                    <Badge variant="secondary" className="text-xs">
                      {post.trigger_type === 'auto' ? (
                        <><Clock className="mr-1 h-3 w-3" /> Auto</>
                      ) : (
                        'Manual'
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {post.post_text}
                  </p>
                  {post.error_message && (
                    <p className="text-xs text-red-500">{post.error_message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {post.posted_at
                      ? format(new Date(post.posted_at), 'MMM d, yyyy h:mm a')
                      : format(new Date(post.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                {post.linkedin_post_id && (
                  <a
                    href={`https://www.linkedin.com/feed/update/${post.linkedin_post_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            ))}

            {total > 20 && (
              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(total / 20)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 20 >= total}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
