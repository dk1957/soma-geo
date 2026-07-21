import { getSupabaseClient } from '@/lib/supabase/client'

export interface Permission {
  resource: string
  action: string
  scope: 'all' | 'own' | 'assigned' | 'none'
}

export type UserRole = 'owner' | 'admin' | 'account_manager' | 'member' | 'viewer'

export interface UserPermissions {
  account_id: string
  user_id: string
  role: UserRole
  permissions: Permission[]
}

/**
 * Check if user has a specific permission in an account
 */
export async function checkUserPermission(
  accountId: string,
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('check_user_permission', {
        user_uuid: userId,
        account_uuid: accountId,
        required_role: null,
        resource,
        action
      })

    if (error) {
      console.error('Error checking user permission:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Permission check failed:', error)
    return false
  }
}

/**
 * Check if user has required role or higher in account
 */
export async function checkUserRole(
  accountId: string,
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .rpc('check_user_permission', {
        user_uuid: userId,
        account_uuid: accountId,
        required_role: requiredRole,
        resource: null,
        action: null
      })

    if (error) {
      console.error('Error checking user role:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Role check failed:', error)
    return false
  }
}

/**
 * Get user's role and permissions in an account
 * Now supports both clerk_id (string) and user_id (UUID)
 */
export async function getUserPermissions(
  accountId: string,
  clerkIdOrUserId: string
): Promise<UserPermissions | null> {
  try {
    const supabase = getSupabaseClient()
    
    // Try to find by clerk_id first (Clerk migration), then fall back to user_id
    let accountUser = null
    let userError = null
    
    // Try clerk_id first
    const { data: clerkUser, error: clerkError } = await supabase
      .from('account_users')
      .select('role, permissions')
      .eq('account_id', accountId)
      .eq('clerk_id', clerkIdOrUserId)
      .eq('is_active', true)
      .single()
    
    if (clerkUser) {
      accountUser = clerkUser
    } else {
      // Fall back to user_id (UUID) for backward compatibility
      const { data: uuidUser, error: uuidError } = await supabase
        .from('account_users')
        .select('role, permissions')
        .eq('account_id', accountId)
        .eq('user_id', clerkIdOrUserId)
        .eq('is_active', true)
        .single()
      
      accountUser = uuidUser
      userError = uuidError
    }

    if (userError || !accountUser) {
      return null
    }

    // Get role permissions
    const { data: rolePermissions, error: permError } = await supabase
      .from('role_permissions')
      .select('resource, action, scope')
      .eq('role', accountUser.role)

    if (permError) {
      console.error('Error fetching role permissions:', permError)
      return null
    }

    return {
      account_id: accountId,
      user_id: clerkIdOrUserId,
      role: accountUser.role as UserRole,
      permissions: rolePermissions || []
    }
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return null
  }
}

/**
 * Check if user can manage another user (based on role hierarchy)
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'owner': 5,
    'admin': 4,
    'account_manager': 3,
    'member': 2,
    'viewer': 1
  }

  return roleHierarchy[managerRole] > roleHierarchy[targetRole]
}

/**
 * Get available roles that a user can assign (based on their own role)
 */
export function getAssignableRoles(userRole: UserRole): UserRole[] {
  switch (userRole) {
    case 'owner':
      return ['admin', 'account_manager', 'member', 'viewer']
    case 'admin':
      return ['account_manager', 'member', 'viewer']
    case 'account_manager':
      return ['member', 'viewer']
    default:
      return []
  }
}

/**
 * Permission constants for common actions
 */
export const PERMISSIONS = {
  // Team management
  TEAM_INVITE: { resource: 'team', action: 'invite' },
  TEAM_MANAGE: { resource: 'team', action: 'manage' },
  TEAM_REMOVE: { resource: 'team', action: 'remove' },
  
  // Account management
  ACCOUNT_READ: { resource: 'accounts', action: 'read' },
  ACCOUNT_UPDATE: { resource: 'accounts', action: 'update' },
  ACCOUNT_DELETE: { resource: 'accounts', action: 'delete' },
  
  // Brand management
  BRAND_CREATE: { resource: 'brands', action: 'create' },
  BRAND_READ: { resource: 'brands', action: 'read' },
  BRAND_UPDATE: { resource: 'brands', action: 'update' },
  BRAND_DELETE: { resource: 'brands', action: 'delete' },
  
  // Workspace management
  WORKSPACE_CREATE: { resource: 'workspaces', action: 'create' },
  WORKSPACE_READ: { resource: 'workspaces', action: 'read' },
  WORKSPACE_UPDATE: { resource: 'workspaces', action: 'update' },
  WORKSPACE_DELETE: { resource: 'workspaces', action: 'delete' },
  
  // Billing
  BILLING_READ: { resource: 'billing', action: 'read' },
  BILLING_UPDATE: { resource: 'billing', action: 'update' },
} as const

/**
 * Hook to use permissions in React components
 */
export function usePermissions(accountId: string, userId: string) {
  const [permissions, setPermissions] = React.useState<UserPermissions | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (accountId && userId) {
      getUserPermissions(accountId, userId)
        .then(setPermissions)
        .finally(() => setLoading(false))
    }
  }, [accountId, userId])

  const hasPermission = React.useCallback((resource: string, action: string) => {
    if (!permissions) return false
    
    // Owners and admins have all permissions
    if (['owner', 'admin'].includes(permissions.role)) {
      return true
    }
    
    return permissions.permissions.some(p => 
      p.resource === resource && 
      p.action === action && 
      p.scope !== 'none'
    )
  }, [permissions])

  const hasRole = React.useCallback((requiredRole: UserRole) => {
    if (!permissions) return false
    
    const roleHierarchy: Record<UserRole, number> = {
      'owner': 5,
      'admin': 4,
      'account_manager': 3,
      'member': 2,
      'viewer': 1
    }

    return roleHierarchy[permissions.role] >= roleHierarchy[requiredRole]
  }, [permissions])

  return {
    permissions,
    loading,
    hasPermission,
    hasRole,
    canInvite: hasPermission('team', 'invite'),
    canManageTeam: hasPermission('team', 'manage'),
    canRemoveMembers: hasPermission('team', 'remove'),
    canManageBrands: hasPermission('brands', 'update'),
    canManageWorkspaces: hasPermission('workspaces', 'update'),
    canViewBilling: hasPermission('billing', 'read'),
  }
}

// For React import
import React from 'react'