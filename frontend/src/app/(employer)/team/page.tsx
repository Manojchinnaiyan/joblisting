'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Mail, MoreHorizontal, Shield, User, Crown, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useTeamMembers,
  useInviteTeamMember,
  useUpdateTeamMemberRole,
  useRemoveTeamMember,
  usePendingInvitations,
  useCancelInvitation,
} from '@/hooks/employer/use-team'
import { TeamMember, TeamInvitation } from '@/lib/api/employer/team'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const roleIcons: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  recruiter: User,
}

const roleColors: Record<string, string> = {
  owner: 'bg-yellow-100 text-yellow-800',
  admin: 'bg-blue-100 text-blue-800',
  recruiter: 'bg-gray-100 text-gray-800',
}

export default function TeamPage() {
  const { data: members, isLoading: membersLoading } = useTeamMembers()
  const { data: invitations, isLoading: invitationsLoading } = usePendingInvitations()
  const inviteMember = useInviteTeamMember()
  const updateRole = useUpdateTeamMemberRole()
  const removeMember = useRemoveTeamMember()
  const cancelInvitation = useCancelInvitation()

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'recruiter'>('recruiter')
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null)
  const [cancellingInvitation, setCancellingInvitation] = useState<TeamInvitation | null>(null)

  const handleInvite = async () => {
    await inviteMember.mutateAsync({
      email: inviteEmail,
      role: inviteRole,
    })
    setIsInviteDialogOpen(false)
    setInviteEmail('')
    setInviteRole('recruiter')
  }

  const handleRemove = async () => {
    if (removingMember) {
      await removeMember.mutateAsync(removingMember.id)
      setRemovingMember(null)
    }
  }

  const handleCancelInvitation = async () => {
    if (cancellingInvitation) {
      await cancelInvitation.mutateAsync(cancellingInvitation.id)
      setCancellingInvitation(null)
    }
  }

  const handleRoleChange = async (memberId: string, role: 'admin' | 'recruiter') => {
    await updateRole.mutateAsync({ id: memberId, data: { role } })
  }

  const isLoading = membersLoading || invitationsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 animate-pulse rounded bg-muted" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">
            Manage your team and their permissions
          </p>
        </div>
        <Button onClick={() => setIsInviteDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {/* Pending Invitations */}
      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations</CardTitle>
            <CardDescription>
              Invitations that haven&apos;t been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {formatDistanceToNow(new Date(invitation.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn('capitalize', roleColors[invitation.role])}>
                      {invitation.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancellingInvitation(invitation)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
          <CardDescription>
            {members?.length || 0} member{(members?.length || 0) !== 1 ? 's' : ''} in your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members?.map((member) => {
              const RoleIcon = roleIcons[member.role] || User
              const isOwner = member.role === 'owner'

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={member.avatar_url}
                        alt={`${member.first_name || ''} ${member.last_name || ''}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {(member.first_name || member.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{member.first_name || member.email || 'Unknown'} {member.last_name || ''}</p>
                      <p className="text-sm text-muted-foreground">{member.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={cn('capitalize', roleColors[member.role])}>
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {member.role}
                    </Badge>
                    {!isOwner && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'recruiter')}>
                            <User className="mr-2 h-4 w-4" />
                            Make Recruiter
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setRemovingMember(member)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove from team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">Owner</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full access to all features</li>
                <li>• Manage billing and subscription</li>
                <li>• Delete company account</li>
                <li>• Transfer ownership</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Admin</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Manage company profile</li>
                <li>• Invite and remove members</li>
                <li>• Post and manage all jobs</li>
                <li>• Access all applications</li>
              </ul>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold">Recruiter</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Post and manage own jobs</li>
                <li>• View applications for own jobs</li>
                <li>• Search candidates</li>
                <li>• View company profile</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your company on the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as 'admin' | 'recruiter')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="recruiter">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Recruiter
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail || inviteMember.isPending}
            >
              {inviteMember.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removingMember?.first_name} {removingMember?.last_name} from your team?
              They will lose access to all company resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation Confirmation */}
      <AlertDialog open={!!cancellingInvitation} onOpenChange={() => setCancellingInvitation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation to {cancellingInvitation?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelInvitation}>
              Yes, Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
