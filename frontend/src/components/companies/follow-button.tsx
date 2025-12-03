'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { toast } from 'sonner'
import { ROUTES } from '@/lib/constants'
import { useFollowCompany, useUnfollowCompany } from '@/hooks/use-company-mutations'

interface FollowButtonProps {
  companyId: string
  isFollowing?: boolean
}

export function FollowButton({ companyId, isFollowing: initialIsFollowing = false }: FollowButtonProps) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const followCompany = useFollowCompany()
  const unfollowCompany = useUnfollowCompany()

  // Only show follow button for job seekers or unauthenticated users
  const canFollow = !isAuthenticated || user?.role === 'JOB_SEEKER'

  if (!canFollow) {
    return null
  }

  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to follow companies')
      router.push(ROUTES.LOGIN)
      return
    }

    try {
      if (isFollowing) {
        await unfollowCompany.mutateAsync(companyId)
        setIsFollowing(false)
      } else {
        await followCompany.mutateAsync(companyId)
        setIsFollowing(true)
      }
    } catch (error) {
      // Error is handled in the mutation hooks
    }
  }

  const isLoading = followCompany.isPending || unfollowCompany.isPending

  return (
    <Button
      variant={isFollowing ? 'default' : 'outline'}
      onClick={handleToggleFollow}
      disabled={isLoading}
    >
      <Heart className={`h-4 w-4 mr-2 ${isFollowing ? 'fill-current' : ''}`} />
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  )
}
