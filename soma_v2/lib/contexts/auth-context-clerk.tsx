'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  user_id: string | null
  clerk_id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  onboarding_status: string
  onboarding_completed_at: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    fullName: string | null
    imageUrl: string | null
  } | null
  profile: Profile | null
  isLoading: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  
  // Track which user ID we've fetched profile for to prevent duplicate fetches
  const fetchedForUserRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  const fetchProfile = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return
    
    if (!clerkUser?.id) {
      setProfile(null)
      setIsLoadingProfile(false)
      return
    }
    
    // Skip if we already fetched for this user
    if (fetchedForUserRef.current === clerkUser.id && profile) {
      setIsLoadingProfile(false)
      return
    }

    isFetchingRef.current = true
    try {
      const response = await fetch('/api/accounts/profile/me')
      
      // If we get a redirect to signin, user is not authenticated
      if (response.redirected && response.url.includes('/signin')) {
        console.log('Profile fetch: Redirected to signin - user not authenticated')
        setProfile(null)
        fetchedForUserRef.current = null
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        fetchedForUserRef.current = clerkUser.id
      } else if (response.status === 401) {
        // User is not authenticated - don't retry
        console.log('Profile fetch: User not authenticated')
        setProfile(null)
        fetchedForUserRef.current = null
      } else {
        // Profile might not exist yet - that's OK
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setIsLoadingProfile(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    if (isClerkLoaded && isSignedIn && clerkUser?.id) {
      // Only fetch if we haven't fetched for this user yet
      if (fetchedForUserRef.current !== clerkUser.id) {
        fetchProfile()
      } else {
        setIsLoadingProfile(false)
      }
    } else if (isClerkLoaded && !isSignedIn) {
      setProfile(null)
      setIsLoadingProfile(false)
      fetchedForUserRef.current = null
    }
  }, [isClerkLoaded, isSignedIn, clerkUser?.id])

  const signOut = async () => {
    try {
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedBrandId')
        localStorage.removeItem('selectedWorkspaceId')
        // Clear any dashboard access cache
        const keys = Object.keys(localStorage).filter(k => k.startsWith('dashboard_access_'))
        keys.forEach(k => localStorage.removeItem(k))
      }

      // Sign out from Clerk
      await clerkSignOut()
      
      // Redirect to signin
      router.push('/signin')
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even on error
      router.push('/signin')
    }
  }

  const refreshProfile = async () => {
    // Reset the ref to force a fresh fetch
    fetchedForUserRef.current = null
    setIsLoadingProfile(true)
    await fetchProfile()
  }

  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress || '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    fullName: clerkUser.fullName,
    imageUrl: clerkUser.imageUrl,
  } : null

  const isLoading = !isClerkLoaded || isLoadingProfile

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSignedIn: !!isSignedIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
