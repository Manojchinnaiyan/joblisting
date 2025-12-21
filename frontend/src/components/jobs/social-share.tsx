'use client'

import { useState } from 'react'
import { Twitter, Linkedin, Facebook, Link2, Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface SocialShareProps {
  title: string
  url: string
  description?: string
}

export function SocialShare({ title, url, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast({
        title: 'Link copied',
        description: 'Job link has been copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      })
    }
  }

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400')
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Share this job</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('twitter')}
          className="h-10 w-10"
          title="Share on X"
        >
          <Twitter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('linkedin')}
          className="h-10 w-10"
          title="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('facebook')}
          className="h-10 w-10"
          title="Share on Facebook"
        >
          <Facebook className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleShare('whatsapp')}
          className="h-10 w-10"
          title="Share on WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyLink}
          className="h-10 w-10"
          title={copied ? 'Copied!' : 'Copy link'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
