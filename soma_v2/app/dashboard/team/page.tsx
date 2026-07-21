"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/layout/notification-toast"
import { usePermissions } from "@/lib/utils/permissions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Crown, 
  User, 
  Shield, 
  Eye, 
  Users, 
  MoreVertical, 
  Mail, 
  Clock, 
  CheckCircle,
  XCircle,
  UserPlus,
  Copy,
  ExternalLink,
  Trash2,
  Edit3,
  Activity,
  Settings,
  Plus,
  AlertCircle,
  Send,
  MoreHorizontal,
  LinkIcon
} from "lucide-react"
import { InviteTeamDialog } from "@/components/invite-team-dialog"

interface TeamMember {
  id: string
  email: string
  role: string
  status: 'active' | 'invited' | 'suspended'
  first_name?: string
  last_name?: string
  avatar_url?: string
  joined_at: string
  last_active?: string
}

interface TeamInvitation {
  id: string
  email: string
  role: string
  invited_by: string
  invited_at: string
  expires_at: string
  message?: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}

interface InviteLink {
  id: string
  role: string
  created_by: string
  created_at: string
  expires_at: string
  uses_count: number
  max_uses?: number
  is_active: boolean
}

const roleIcons = {
  'owner': Crown,
  'admin': Shield,
  'account_manager': Users,
  'member': User,
  'viewer': Eye
}

const roleColors = {
  'owner': 'bg-purple-100 text-purple-700 border-purple-200',
  'admin': 'bg-red-100 text-red-700 border-red-200',
  'account_manager': 'bg-blue-100 text-blue-700 border-blue-200',
  'member': 'bg-green-100 text-green-700 border-green-200',
  'viewer': 'bg-gray-100 text-gray-700 border-gray-200'
}

const statusColors = {
  'active': 'bg-green-100 text-green-700',
  'invited': 'bg-yellow-100 text-yellow-700',
  'suspended': 'bg-red-100 text-red-700',
  'pending': 'bg-yellow-100 text-yellow-700',
  'accepted': 'bg-green-100 text-green-700',
  'expired': 'bg-gray-100 text-gray-700',
  'cancelled': 'bg-red-100 text-red-700'
}

export default function TeamPage() {
  const { addToast, ToastContainer } = useToast()
  // TODO: Get actual accountId and userId from auth context
  const { hasPermission, loading: permissionsLoading } = usePermissions('', '')
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!permissionsLoading) {
      fetchTeamData()
    }
  }, [permissionsLoading])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchTeamMembers(),
        fetchInvitations(),
        fetchInviteLinks()
      ])
    } catch (error) {
      console.error('Error fetching team data:', error)
      addToast({
        type: "error",
        title: "Failed to load team data",
        message: "Please try refreshing the page"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/accounts/teams/members')
      const data = await response.json()
      
      if (response.ok) {
        setMembers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/accounts/teams/invitations')
      const data = await response.json()
      
      if (response.ok) {
        setInvitations(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const fetchInviteLinks = async () => {
    try {
      const response = await fetch('/api/accounts/teams/invite-links')
      const data = await response.json()
      
      if (response.ok) {
        setInviteLinks(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching invite links:', error)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) {
      return
    }

    try {
      const response = await fetch(`/api/accounts/teams/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Member removed",
          message: "Team member has been successfully removed"
        })
        fetchTeamMembers()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove member')
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to remove member",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/accounts/teams/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
        credentials: 'include'
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Role updated",
          message: "Team member role has been updated successfully"
        })
        fetchTeamMembers()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update role')
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to update role",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/accounts/teams/invitations/${invitationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Invitation cancelled",
          message: "The invitation has been cancelled"
        })
        fetchInvitations()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel invitation')
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to cancel invitation",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    }
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/accounts/teams/invitations/${invitationId}/resend`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        addToast({
          type: "success",
          title: "Invitation resent",
          message: "The invitation has been sent again"
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to resend invitation')
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to resend invitation",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    }
  }

  const handleCopyInviteLink = async (linkId: string) => {
    try {
      const link = inviteLinks.find(l => l.id === linkId)
      if (!link) return

      const inviteUrl = `${window.location.origin}/invite/link/${linkId}`
      await navigator.clipboard.writeText(inviteUrl)
      
      addToast({
        type: "success",
        title: "Link copied",
        message: "Invite link has been copied to clipboard"
      })
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to copy link",
        message: "Could not copy the invite link"
      })
    }
  }

  const canManageTeam = hasPermission('team', 'manage')
  const canInviteMembers = hasPermission('team', 'invite')

  if (permissionsLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!canManageTeam && !canInviteMembers) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view team settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <ToastContainer />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">
            Manage your team members, invitations, and permissions
          </p>
        </div>
        {canInviteMembers && (
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        )}
      </div>

      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.length}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for acceptance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invite Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inviteLinks.length}</div>
            <p className="text-xs text-muted-foreground">
              Shareable invite links
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Online Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.last_active && new Date(m.last_active) > new Date(Date.now() - 3600000)).length}
            </div>
            <p className="text-xs text-muted-foreground">Active in last hour</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 h-12 rounded-lg p-1 gap-1 w-full">
          <TabsTrigger value="members" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Team Members</TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Pending Invitations</TabsTrigger>
          <TabsTrigger value="links" className="gap-2 text-gray-500 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md px-5 py-2 text-sm font-medium transition-all flex-1">Invite Links</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({members.length})</CardTitle>
              <CardDescription>
                Manage your team members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role as keyof typeof roleIcons] || User
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>
                            {member.first_name?.[0]}{member.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`${roleColors[member.role as keyof typeof roleColors]} border text-xs`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1).replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={`${statusColors[member.status]} text-xs`}>
                              {member.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {member.status === 'invited' && <Clock className="h-3 w-3 mr-1" />}
                              {member.status === 'suspended' && <XCircle className="h-3 w-3 mr-1" />}
                              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Joined {new Date(member.joined_at).toLocaleDateString()}</div>
                          {member.last_active && (
                            <div>Last active {new Date(member.last_active).toLocaleDateString()}</div>
                          )}
                        </div>
                        
                        {canManageTeam && member.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'admin')}>
                                <Shield className="h-4 w-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')}>
                                <User className="h-4 w-4 mr-2" />
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'viewer')}>
                                <Eye className="h-4 w-4 mr-2" />
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {members.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No team members found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
              <CardDescription>
                Manage sent invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => {
                  const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons] || User
                  const isExpired = new Date(invitation.expires_at) < new Date()
                  
                  return (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{invitation.email}</div>
                          <div className="text-sm text-muted-foreground">
                            Invited by {invitation.invited_by}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`${roleColors[invitation.role as keyof typeof roleColors]} border text-xs`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1).replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={`${statusColors[invitation.status]} text-xs`}>
                              {invitation.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                              {invitation.status === 'expired' && <XCircle className="h-3 w-3 mr-1" />}
                              {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Sent {new Date(invitation.invited_at).toLocaleDateString()}</div>
                          <div className={isExpired ? 'text-red-600' : ''}>
                            Expires {new Date(invitation.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {canManageTeam && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!isExpired && invitation.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleResendInvitation(invitation.id)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                {invitations.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending invitations
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invite Links ({inviteLinks.length})</CardTitle>
              <CardDescription>
                Shareable links for team invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inviteLinks.map((link) => {
                  const RoleIcon = roleIcons[link.role as keyof typeof roleIcons] || User
                  const isExpired = new Date(link.expires_at) < new Date()
                  
                  return (
                    <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <ExternalLink className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {link.role.charAt(0).toUpperCase() + link.role.slice(1).replace('_', ' ')} Role Link
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Used {link.uses_count} time{link.uses_count !== 1 ? 's' : ''}
                            {link.max_uses && ` of ${link.max_uses}`}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`${roleColors[link.role as keyof typeof roleColors]} border text-xs`}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {link.role.charAt(0).toUpperCase() + link.role.slice(1).replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={`${link.is_active && !isExpired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs`}>
                              {link.is_active && !isExpired ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Created {new Date(link.created_at).toLocaleDateString()}</div>
                          <div className={isExpired ? 'text-red-600' : ''}>
                            Expires {new Date(link.expires_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopyInviteLink(link.id)}
                          disabled={!link.is_active || isExpired}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  )
                })}
                
                {inviteLinks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No invite links created
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* TODO: fix InviteTeamDialog props interface */}
      <InviteTeamDialog 
        // @ts-expect-error - Props interface mismatch
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInviteSent={() => {
          fetchInvitations()
          fetchInviteLinks()
        }}
      />
    </div>
  )
}
