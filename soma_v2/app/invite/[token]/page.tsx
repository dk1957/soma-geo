"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useUser, useSignUp } from "@clerk/nextjs"
import { useToast } from "@/components/layout/notification-toast"
import { Crown, User, Shield, Eye, CheckCircle, XCircle, Clock, Building2, Users } from "lucide-react"

interface InvitationDetails {
  email: string
  role: string
  message?: string
  account_name: string
  account_type: string
  invited_by: string
  expires_at: string
}

const roleIcons = {
  'owner': Crown,
  'admin': Shield,
  'account_manager': Users,
  'member': User,
  'viewer': Eye
}

const roleDescriptions = {
  'owner': 'Full account control and billing access',
  'admin': 'Full team and brand management access',
  'account_manager': 'Team and assigned brand management',
  'member': 'Standard workspace access',
  'viewer': 'Read-only access to assigned workspaces'
}

const roleColors = {
  'owner': 'bg-purple-100 text-purple-700 border-purple-200',
  'admin': 'bg-red-100 text-red-700 border-red-200',
  'account_manager': 'bg-blue-100 text-blue-700 border-blue-200',
  'member': 'bg-green-100 text-green-700 border-green-200',
  'viewer': 'bg-gray-100 text-gray-700 border-gray-200'
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast, ToastContainer } = useToast()
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isProduction, setIsProduction] = useState(false)

  const token = params.token as string

  useEffect(() => {
    // Detect environment
    const isProd = process.env.NODE_ENV === 'production' || 
                   window.location.hostname !== 'localhost'
    setIsProduction(isProd)
    
    const initializePage = async () => {
      if (token) {
        await fetchInvitationDetails()
      }
    }
    initializePage()
  }, [token])

  // Wait for Clerk to load
  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const fetchInvitationDetails = async () => {
    try {
      const response = await fetch(`/api/accounts/teams/accept-invite?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch invitation details')
        return
      }

      console.log('📧 Invitation loaded:', data.data)
      setInvitation(data.data)
    } catch (error) {
      console.error('Error fetching invitation:', error)
      setError('Failed to load invitation details')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!isSignedIn) {
      // Redirect to sign-up with invitation context
      const returnUrl = encodeURIComponent(`/invite/${token}`)
      const encodedEmail = encodeURIComponent(invitation?.email || '')
      router.push(`/signup?redirect_url=${returnUrl}&email_address=${encodedEmail}`)
      return
    }

    console.log('🚀 Accepting invitation...', { token, userEmail: clerkUser?.emailAddresses[0]?.emailAddress, invitedEmail: invitation?.email })
    setAccepting(true)

    addToast({
      type: "info",
      title: "Accepting Invitation...",
      message: "Adding you to the organization",
    })

    try {
      const response = await fetch('/api/accounts/teams/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ Accept failed:', data)
        throw new Error(data.error || 'Failed to accept invitation')
      }

      console.log('✅ Invitation accepted:', data)

      addToast({
        type: "success",
        title: "Welcome to the team!",
        message: `You've successfully joined ${invitation?.account_name}`
      })

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error) {
      console.error('Error accepting invitation:', error)
      addToast({
        type: "error",
        title: "Failed to accept invitation",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      })
    } finally {
      setAccepting(false)
    }
  }

  const handleDeclineInvitation = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ToastContainer />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <ToastContainer />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link may have expired or been cancelled.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const RoleIcon = roleIcons[invitation.role as keyof typeof roleIcons] || User
  const isExpired = new Date(invitation.expires_at) < new Date()

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer />
      
      {/* Header */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">Soma AI</span>
              <span className="text-xs text-muted-foreground/80 font-medium tracking-wider">GEO PLATFORM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">You're Invited!</CardTitle>
              <CardDescription className="text-lg">
                {invitation.invited_by} has invited you to join their team on Soma
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Invitation Details */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Organization:</span>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-semibold">{invitation.account_name}</span>
                    <Badge variant="outline" className="ml-2">
                      {invitation.account_type === 'agency' ? 'Agency' : 'In-house'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Your Role:</span>
                  <Badge className={`${roleColors[invitation.role as keyof typeof roleColors]} border`}>
                    <RoleIcon className="h-4 w-4 mr-1" />
                    {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1).replace('_', ' ')}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Email:</span>
                  <span className="font-mono text-sm bg-background px-2 py-1 rounded">
                    {invitation.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Expires:</span>
                  <span className={`text-sm ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {new Date(invitation.expires_at).toLocaleDateString()} at{' '}
                    {new Date(invitation.expires_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Role Permissions */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  What you'll be able to do:
                </h4>
                <p className="text-muted-foreground">
                  {roleDescriptions[invitation.role as keyof typeof roleDescriptions]}
                </p>
              </div>

              {/* Personal Message */}
              {invitation.message && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Personal Message:</h4>
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <p className="text-blue-800 italic">"{invitation.message}"</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              {isExpired ? (
                <div className="text-center space-y-4">
                  <div className="text-red-600 font-medium">This invitation has expired</div>
                  <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                    Go to Home
                  </Button>
                </div>
              ) : magicLinkSent ? (
                <div className="space-y-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-center space-y-3">
                    <h3 className="font-semibold text-lg text-black">Check Your Email</h3>
                    <p className="text-sm text-gray-600">
                      We've sent a verification email to <strong>{invitation?.email}</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      Click the link in your email to complete your signup and join {invitation?.account_name}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-xs text-blue-800 text-center">
                      💡 After verifying your email, you'll be automatically added to the team and redirected to your dashboard
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleDeclineInvitation}
                    variant="outline" 
                    className="flex-1"
                    disabled={accepting}
                  >
                    Decline
                  </Button>
                  <Button 
                    onClick={handleAcceptInvitation}
                    className="flex-1"
                    disabled={accepting}
                  >
                    {accepting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Joining...
                      </>
                    ) : isSignedIn ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Invitation
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create Account & Accept
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!isSignedIn && !isExpired && !magicLinkSent && (
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">
                    New to Soma? We'll create your account automatically when you accept.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Already have an account?{' '}
                    <Link href={`/signin?redirect_url=${encodeURIComponent(`/invite/${token}`)}`} className="text-primary hover:underline">
                      Sign in instead
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* About Soma */}
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">About Soma</h3>
                <p className="text-muted-foreground">
                  Soma is the leading AI discoverability platform that helps brands optimize their 
                  presence across AI models like ChatGPT, Claude, Gemini, and Perplexity. Monitor 
                  citations, improve visibility, and stay ahead in the AI-first world.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}