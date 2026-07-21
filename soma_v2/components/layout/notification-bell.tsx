"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, Check, X, ExternalLink, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

interface Notification {
  id: string
  user_id: string
  account_id: string | null
  brand_id: string | null
  type: 'job' | 'audit' | 'optimization' | 'mention' | 'personal' | 'system'
  title: string
  message: string
  is_read: boolean
  is_dismissed: boolean
  action_url: string | null
  metadata: {
    run_id?: string
    job_id?: string
    status?: string
    completed_at?: string
    results?: {
      completed_jobs?: number
      total_jobs?: number
      success_rate?: number
    }
  } | null
  created_at: string
}

interface NotificationBellProps {
  brandId?: string
  accountId?: string
  className?: string
}

export function NotificationBell({ brandId, accountId, className }: NotificationBellProps) {
  const router = useRouter()
  const { isSignedIn, isLoaded } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // Track if we've already fetched to prevent duplicate initial fetches
  const hasFetchedRef = useRef(false)
  const isFetchingRef = useRef(false)
  const isAuthenticatedRef = useRef(false)

  // Update auth ref when auth state changes
  useEffect(() => {
    isAuthenticatedRef.current = isLoaded && isSignedIn
  }, [isLoaded, isSignedIn])

  const fetchNotifications = useCallback(async () => {
    // Don't fetch if not signed in or already fetching
    if (!isLoaded || !isSignedIn || isFetchingRef.current) {
      return
    }
    
    isFetchingRef.current = true
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (brandId) params.set('brandId', brandId)
      if (accountId) params.set('accountId', accountId)
      params.set('limit', '10')

      const response = await fetch(`/api/accounts/notifications?${params.toString()}`)
      
      // If we get a redirect to signin, user is not authenticated - stop all future requests
      if (response.redirected && response.url.includes('/signin')) {
        console.log('Notifications fetch: Redirected to signin - stopping polling')
        isAuthenticatedRef.current = false
        hasFetchedRef.current = false
        return
      }
      
      if (!response.ok) {
        // If we get 401, user is not authenticated - stop trying
        if (response.status === 401) {
          console.log('Notifications fetch: User not authenticated')
          isAuthenticatedRef.current = false
          hasFetchedRef.current = false
          return
        }
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
      hasFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [brandId, accountId, isLoaded, isSignedIn])

  // Initial fetch and polling - separate from fetchNotifications dependency
  useEffect(() => {
    // Only fetch if signed in and haven't fetched yet
    if (isLoaded && isSignedIn && !hasFetchedRef.current) {
      fetchNotifications()
    }
    
    // Reset fetch flag if user signs out
    if (isLoaded && !isSignedIn) {
      hasFetchedRef.current = false
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isLoaded, isSignedIn])
  
  // Separate polling effect - polls faster when a run is active
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    
    // Check if there's an active running notification → poll faster
    const hasRunningNotification = notifications.some(
      n => n.metadata?.status === 'running'
    )
    const pollInterval = hasRunningNotification ? 10000 : 60000 // 10s during active runs, 60s otherwise
    
    const interval = setInterval(() => {
      // Double-check auth state before polling
      if (isAuthenticatedRef.current) {
        fetchNotifications()
      }
    }, pollInterval)
    
    return () => clearInterval(interval)
  }, [isLoaded, isSignedIn, brandId, accountId, fetchNotifications, notifications])
  
  // Listen for custom events to refresh notifications immediately
  useEffect(() => {
    const refreshHandler = () => {
      if (isAuthenticatedRef.current) {
        fetchNotifications()
      }
    }
    
    window.addEventListener('dashboardRefresh', refreshHandler)
    window.addEventListener('notificationRefresh', refreshHandler)
    
    return () => {
      window.removeEventListener('dashboardRefresh', refreshHandler)
      window.removeEventListener('notificationRefresh', refreshHandler)
    }
  }, [fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/accounts/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'read'
        })
      })

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDismiss = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetch('/api/accounts/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'dismiss'
        })
      })

      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      // Also reduce unread count if it was unread
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/accounts/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read_all' })
      })

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }
    
    // Navigate to action URL if provided
    if (notification.action_url) {
      router.push(notification.action_url)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type: string, status?: string, createdAt?: string) => {
    if (status === 'completed') {
      return <Check className="h-4 w-4 text-green-500" />
    }
    if (status === 'running') {
      // Check if the notification is older than 5 minutes - likely stale
      if (createdAt) {
        const ageMs = Date.now() - new Date(createdAt).getTime()
        const fiveMinutes = 5 * 60 * 1000
        if (ageMs > fiveMinutes) {
          // Show a warning icon for stale running notifications
          return <AlertTriangle className="h-4 w-4 text-yellow-500" />
        }
      }
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
    if (status === 'failed' || status === 'timeout') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    return null
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative", className)}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading && notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer",
                  !notification.is_read && "bg-blue-50/50 dark:bg-blue-950/20"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getNotificationIcon(notification.type, notification.metadata?.status, notification.created_at)}
                    <span className={cn(
                      "text-sm font-medium truncate",
                      !notification.is_read && "text-blue-600 dark:text-blue-400"
                    )}>
                      {notification.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(notification.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Dismiss notification"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 w-full">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between w-full mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                  {notification.action_url && (
                    <span className="text-xs text-blue-500 flex items-center gap-1">
                      View <ExternalLink className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NotificationBell
