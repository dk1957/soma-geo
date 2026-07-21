"use client"

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@clerk/nextjs';

// User type compatible with Clerk user object
interface ClerkCompatibleUser {
  id: string;
  email?: string;
}

// Custom hook to safely handle search params in context
function useClientSearchParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchParams(new URLSearchParams(window.location.search));
      
      // Listen for URL changes (back/forward)
      const handleLocationChange = () => {
        setSearchParams(new URLSearchParams(window.location.search));
      };
      
      window.addEventListener('popstate', handleLocationChange);
      return () => window.removeEventListener('popstate', handleLocationChange);
    }
  }, [pathname]);
  
  return searchParams;
}
import { clearProblematicCookies } from '@/lib/utils/cookie-cleanup';

// Types based on our database schema
export interface Profile {
  id: string;
  user_id?: string | null;  // Legacy Supabase auth UUID (may be null for Clerk users)
  clerk_id: string;         // Clerk user ID
  email: string;
  full_name?: string;
  avatar_url?: string;
  region?: string;
  timezone?: string;
  language_preference?: string;
  role?: string;
  onboarding_status?: string;
}

export interface Account {
  id: string;
  name: string;
  slug: string;
  account_type: 'agency' | 'in_house';
  description?: string;
  logo_url?: string;
  owner_id?: string | null;     // Legacy Supabase auth UUID (may be null)
  owner_clerk_id?: string;      // Clerk user ID of the owner
  company_size?: string;
  industry?: string;
  billing_plan?: string;
  billing_status?: string;
  is_active: boolean;
}

export interface Brand {
  id: string;
  account_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  industry?: string;
  brand_type: 'client' | 'own';
  entity_type?: 'company' | 'product' | 'service' | 'personality' | 'organization' | 'government' | 'campaign' | 'location';
  primary_domain?: string;
  is_active: boolean;
  // Company information fields
  company_name?: string;
  company_website?: string;
  company_location?: string;
  // Category fields for database constraint compliance
  brand_category?: string;
  brand_categories?: string[];
  // Additional onboarding fields (optional for API compatibility)
  brandCategories?: string[];
  businessType?: string;
  businessModel?: string;
  businessStage?: string;
  productsServices?: string;
  targetAudience?: string;
  primaryValue?: string;
  targetMarkets?: string[];
  knownCompetitors?: string[];
  // Brand voice and tone for content creation
  brand_voice?: {
    tone?: string;
    style_guidelines?: string[];
    key_messages?: string[];
    avoid_terms?: string[];
  };
  tone?: string;
  // Relations
  account?: Account;
  workspace?: Workspace;
  manager_role?: string; // User's role for this brand
}

export interface Workspace {
  id: string;
  account_id: string;
  brand_id: string;
  name: string;
  slug: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  // Relations
  brand?: Brand;
}

export interface AccountUser {
  id: string;
  account_id: string;
  user_id?: string | null;  // Legacy Supabase auth UUID (may be null)
  clerk_id?: string;        // Clerk user ID
  role: 'owner' | 'admin' | 'account_manager' | 'member' | 'viewer';
  permissions?: Record<string, any>;
  is_active: boolean;
  account?: Account;
}

export interface BrandManager {
  id: string;
  brand_id: string;
  user_id?: string | null;  // Legacy Supabase auth UUID (may be null)
  clerk_id?: string;        // Clerk user ID
  role: 'primary_manager' | 'manager' | 'collaborator';
  is_active: boolean;
  brand?: Brand;
}

interface BrandContextType {
  // User and authentication
  user: ClerkCompatibleUser | null;
  profile: Profile | null;
  
  // Current selections
  currentAccount: Account | null;
  currentBrand: Brand | null;
  currentWorkspace: Workspace | null;
  
  // User's accessible data
  userAccounts: AccountUser[];
  userBrands: Brand[];
  userWorkspaces: Workspace[];
  
  // Loading states
  isLoading: boolean;
  isLoadingBrands: boolean;
  
  // Actions
  switchAccount: (accountId: string) => Promise<void>;
  switchBrand: (brandId: string) => Promise<void>;
  createBrand: (brandData: Partial<Brand>) => Promise<Brand | null>;
  inviteUserToBrand: (brandId: string, email: string, role: string) => Promise<boolean>;
  updateBrandSettings: (brandId: string, settings: Partial<Brand>) => Promise<boolean>;
  refreshUserData: () => Promise<void>;
  
  // Utilities
  canCreateBrand: (accountId?: string) => boolean;
  canManageBrand: (brandId: string) => boolean;
  canInviteUsers: (brandId: string) => boolean;
  getBrandShareLink: (brandId: string) => string;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

interface BrandProviderProps {
  children: ReactNode;
  user: ClerkCompatibleUser | null;
}

export function BrandProvider({ children, user }: BrandProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useClientSearchParams();
  const { isSignedIn, isLoaded } = useSession();
  
  // Memoize the brand query parameter to prevent unnecessary re-renders
  const brandQueryParam = useMemo(() => searchParams?.get('brand') || null, [searchParams]);
  
  // Clear any problematic cookies on initialization to prevent HTTP 431 errors
  useEffect(() => {
    clearProblematicCookies();
  }, []);
  
  // Only create Supabase client on client side
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (typeof document === 'undefined') return null;
    if (typeof navigator === 'undefined') return null;
    try {
      return getSupabaseClient();
    } catch (error) {
      console.warn('Failed to create Supabase client:', error);
      return null;
    }
  }, []);
  
  // State management
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  
  const [userAccounts, setUserAccounts] = useState<AccountUser[]>([]);
  const [userBrands, setUserBrands] = useState<Brand[]>([]);
  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  
  // Refs to prevent duplicate fetches and infinite loops
  const profileLoadedRef = useRef(false);
  const dataLoadedRef = useRef(false);
  const brandInitializedRef = useRef(false);

  // Load user profile - only once per user session
  useEffect(() => {
    if (isLoaded && isSignedIn && user && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      loadUserProfile();
    } else if (isLoaded && !isSignedIn) {
      profileLoadedRef.current = false;
      dataLoadedRef.current = false;
      brandInitializedRef.current = false;
      resetState();
    }
  }, [user?.id, isLoaded, isSignedIn]);

  // Load user data when profile is loaded - only once
  useEffect(() => {
    if (profile && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadUserData();
    }
  }, [profile?.id]);

    // Handle URL-based brand initialization - only once when brands load
  useEffect(() => {
    // Only run once when brands first load
    if (userBrands.length > 0 && !brandInitializedRef.current) {
      brandInitializedRef.current = true;
      
      // First check if we're on a brand-specific route (path-based brand)
      const brandRouteMatch = pathname.match(/^\/dashboard\/brands\/([^\/]+)/);
      let targetBrandId: string | null = null;
      
      if (brandRouteMatch) {
        // Extract brand ID from the path for brand-specific routes
        targetBrandId = brandRouteMatch[1];
      } else {
        // Fall back to query parameter for other routes
        targetBrandId = brandQueryParam;
      }
      
      if (targetBrandId) {
        const targetBrand = userBrands.find(b => b.id === targetBrandId);
        if (targetBrand) {
          setCurrentBrand(targetBrand);
          setCurrentWorkspace(targetBrand.workspace || null);
          
          // Update localStorage for persistence
          try {
            localStorage.setItem('selectedBrandId', targetBrandId);
            if (targetBrand.workspace?.id) {
              localStorage.setItem('selectedWorkspaceId', targetBrand.workspace.id);
            }
          } catch (error) {
            console.error('Failed to save URL brand to storage:', error);
          }
          return;
        }
      }
      
      // If no URL brand or URL brand not found, fall back to localStorage
      try {
        let defaultBrand: Brand | null = null;
        
        const savedBrandId = localStorage.getItem('selectedBrandId');
        if (savedBrandId) {
          defaultBrand = userBrands.find(b => b.id === savedBrandId) || null;
        }
        
        if (defaultBrand) {
          setCurrentBrand(defaultBrand);
          setCurrentWorkspace(defaultBrand.workspace || null);
        } else {
          // No saved brand, select first available
          const firstBrand = userBrands[0];
          setCurrentBrand(firstBrand);
          setCurrentWorkspace(firstBrand.workspace || null);
        }
      } catch (error) {
        console.error('Failed to load selected brand from storage:', error);
      }
    }
  }, [userBrands.length]);

  const resetState = () => {
    setProfile(null);
    setCurrentAccount(null);
    setCurrentBrand(null);
    setCurrentWorkspace(null);
    setUserAccounts([]);
    setUserBrands([]);
    setUserWorkspaces([]);
    setIsLoading(false);
    
    // Clear stored brand selection from localStorage
    // Note: httpOnly cookies are cleared server-side via signout route
    try {
      localStorage.removeItem('selectedBrandId');
      localStorage.removeItem('selectedWorkspaceId');
    } catch (error) {
      console.error('Failed to clear selected brand from storage:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // Fetch profile via API route which uses service client with proper auth
      const response = await fetch('/api/accounts/profile/me');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated');
          setIsLoading(false);
          setIsLoadingBrands(false);
          return;
        }
        if (response.status === 404) {
          console.log('Profile not found for user, may need to complete onboarding');
          setIsLoading(false);
          setIsLoadingBrands(false);
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.profile) {
        setProfile(data.profile);
      } else {
        console.log('Profile not found for user, may need to complete onboarding');
        setIsLoading(false);
        setIsLoadingBrands(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setIsLoading(false);
      setIsLoadingBrands(false);
    }
  };

  const loadUserData = async () => {
    if (!user || !supabase || !profile) return;

    setIsLoading(true);
    try {
      // Prefer server-side profile account memberships (safe from RLS)
      const clerkId = profile.clerk_id || user.id;
      console.log('Loading account_users for clerk_id:', clerkId);

      if ((profile as any).account_memberships && (profile as any).account_memberships.length > 0) {
        // Transform server-provided account_memberships into AccountUser-like objects
        const serverAccounts = (profile as any).account_memberships.map((acct: any) => ({
          id: acct.id,
          account_id: acct.id,
          clerk_id: clerkId,
          role: acct.user_role || 'member',
          is_active: true,
          account: acct
        }));

        console.log('Using server account_memberships:', serverAccounts);
        setUserAccounts(serverAccounts);

        if (!currentAccount && serverAccounts.length > 0) {
          const defaultAccount = serverAccounts.find((au: any) => au.role === 'owner')?.account || serverAccounts[0].account;
          setCurrentAccount(defaultAccount);
        }

        // If server provided accessible brands (bypass client RLS), use them to populate brands directly
        if ((profile as any).accessible_brands && (profile as any).accessible_brands.length > 0) {
          const accessible = (profile as any).accessible_brands as any[]
          console.log('Using server accessible_brands:', accessible)

          const processedBrands = accessible.map((brand: any) => {
            const userAccountRole = serverAccounts.find((au: any) => au.account_id === brand.account_id)?.role;
            return {
              ...brand,
              targetMarkets: brand.target_markets || [],
              knownCompetitors: brand.known_competitors || [],
              brandCategories: brand.brand_categories || [],
              productsServices: brand.products_services || brand.productsServices || '',
              manager_role: userAccountRole === 'owner' || userAccountRole === 'admin' ? 'manager' : 'viewer',
              workspace: brand.workspaces?.[0] || null
            } as Brand
          })

          setUserBrands(processedBrands)

          if (!currentBrand && processedBrands.length > 0) {
            setCurrentBrand(processedBrands[0])
            setCurrentWorkspace(processedBrands[0].workspace || null)
          }

          const workspaces = processedBrands.map(b => b.workspace).filter(Boolean) as Workspace[]
          setUserWorkspaces(workspaces)

          setIsLoading(false)
          setIsLoadingBrands(false)
          return
        }

        await loadUserBrandsWithAccounts(serverAccounts);
        return;
      }

      // If server provided accessible brands (bypass client RLS), use them to populate brands directly
      if ((profile as any).accessible_brands && (profile as any).accessible_brands.length > 0) {
        const accessible = (profile as any).accessible_brands as any[]
        console.log('Using server accessible_brands:', accessible)

        const processedBrands = accessible.map((brand: any) => {
          const userAccountRole = serverAccounts.find((au: any) => au.account_id === brand.account_id)?.role;
          return {
            ...brand,
            targetMarkets: brand.target_markets || [],
            knownCompetitors: brand.known_competitors || [],
            brandCategories: brand.brand_categories || [],
            productsServices: brand.products_services || brand.productsServices || '',
            manager_role: userAccountRole === 'owner' || userAccountRole === 'admin' ? 'manager' : 'viewer',
            workspace: brand.workspaces?.[0] || null
          } as Brand
        })

        setUserBrands(processedBrands)

        if (!currentBrand && processedBrands.length > 0) {
          setCurrentBrand(processedBrands[0])
          setCurrentWorkspace(processedBrands[0].workspace || null)
        }

        const workspaces = processedBrands.map(b => b.workspace).filter(Boolean) as Workspace[]
        setUserWorkspaces(workspaces)

        setIsLoading(false)
        setIsLoadingBrands(false)
        return
      }

      // Fallback: attempt client-side query (may be blocked by RLS if JWT not forwarded)
      const { data: accountsData, error: accountsError } = await supabase
        .from('account_users')
        .select(`
          *,
          account:accounts(*)
        `)
        .eq('clerk_id', clerkId)
        .eq('is_active', true);

      if (accountsError) {
        console.error('Error loading accounts:', accountsError);
        setUserAccounts([]); // Ensure state is cleared on error
        setIsLoading(false); // Stop loading on error
        return;
      }

      console.log('Loaded accountsData:', accountsData); // ADDED FOR DEBUGGING
      setUserAccounts(accountsData || []);

      // Set default account if none selected
      if (!currentAccount && accountsData && accountsData.length > 0) {
        const defaultAccount = accountsData.find((au: any) => au.role === 'owner')?.account || accountsData[0].account;
        setCurrentAccount(defaultAccount);
      }

      // Load user brands across all accounts with the fresh accountsData
      await loadUserBrandsWithAccounts(accountsData || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserBrandsWithAccounts = async (accounts: AccountUser[]) => {
    if (!user || accounts.length === 0) {
      return;
    }

    setIsLoadingBrands(true);
    try {
      // Get account IDs that the user has access to
      const accountIds = accounts.map(au => au.account_id);

      // Load brands the user has access to through account membership
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select(`
          *,
          account:accounts(*),
          workspaces(*)
        `)
        .in('account_id', accountIds)
        .eq('is_active', true);

      if (brandsError) {
        console.error('Error loading brands:', brandsError);
        return;
      }

      // Process brands and add manager role info
      const processedBrands = (brandsData || []).map((brand: any) => {
        const userAccountRole = accounts.find((au: any) => au.account_id === brand.account_id)?.role;
        
        return {
          ...brand,
          // Map snake_case DB columns to camelCase interface properties
          targetMarkets: brand.target_markets || [],
          knownCompetitors: brand.known_competitors || [],
          brandCategories: brand.brand_categories || [],
          productsServices: brand.products_services || brand.productsServices || '',
          manager_role: userAccountRole === 'owner' || userAccountRole === 'admin' ? 'manager' : 'viewer',
          workspace: brand.workspaces?.[0] || null
        };
      });

      setUserBrands(processedBrands);

      // Set default brand - check localStorage for saved brand
      if (!currentBrand && processedBrands.length > 0) {
        let defaultBrand = processedBrands[0];
        
        // Try to restore previously selected brand from localStorage
        try {
          const savedBrandId = localStorage.getItem('selectedBrandId');
          if (savedBrandId) {
            const savedBrand = processedBrands.find((b: any) => b.id === savedBrandId);
            if (savedBrand) {
              defaultBrand = savedBrand;
            }
          }
        } catch (error) {
          console.error('Failed to load selected brand from storage:', error);
        }
        
        setCurrentBrand(defaultBrand);
        setCurrentWorkspace(defaultBrand.workspace || null);
      }

      // Load workspaces
      const workspaces = processedBrands
        .map((brand: any) => brand.workspace)
        .filter(Boolean) as Workspace[];
      setUserWorkspaces(workspaces);

    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const loadUserBrands = async () => {
    return loadUserBrandsWithAccounts(userAccounts);
  };

  const switchAccount = async (accountId: string) => {
    const accountUser = userAccounts.find(au => au.account_id === accountId);
    if (!accountUser) return;

    setCurrentAccount(accountUser.account!);
    
    // Clear sessionStorage caches to prevent stale data from previous account
    try {
      sessionStorage.clear();
    } catch (e) {
      console.warn('Failed to clear sessionStorage during account switch:', e);
    }
    
    // Reset brand and workspace when switching accounts
    setCurrentBrand(null);
    setCurrentWorkspace(null);
    
    // Filter brands for new account
    const accountBrands = userBrands.filter(brand => brand.account_id === accountId);
    if (accountBrands.length > 0) {
      setCurrentBrand(accountBrands[0]);
      setCurrentWorkspace(accountBrands[0].workspace || null);
    }
  };

  const switchBrand = async (brandId: string) => {
    // Guard: don't switch to the brand we're already on
    if (brandId === currentBrand?.id) return;
    
    let brand = userBrands.find(b => b.id === brandId);
    
    // If brand not found in local cache, try fetching it from the database
    if (!brand) {
      console.log('Brand not found in cache, fetching from database...');
      setIsLoadingBrands(true);
      
      try {
        // Fetch the brand directly from database
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select(`
            *,
            account:accounts(*),
            workspaces(*)
          `)
          .eq('id', brandId)
          .eq('is_active', true)
          .single();
        
        if (brandError || !brandData) {
          console.error('Brand not found in database:', brandId, brandError);
          setIsLoadingBrands(false);
          return;
        }
        
        // Check if user has access to this brand's account
        const hasAccess = userAccounts.some(au => au.account_id === brandData.account_id);
        if (!hasAccess) {
          console.error('User does not have access to this brand:', brandId);
          setIsLoadingBrands(false);
          return;
        }
        
        // Process the brand data
        const userAccountRole = userAccounts.find(au => au.account_id === brandData.account_id)?.role;
        brand = {
          ...brandData,
          manager_role: userAccountRole === 'owner' || userAccountRole === 'admin' ? 'manager' : 'viewer',
          workspace: brandData.workspaces?.[0] || null
        };
        
        // Add the brand to the local cache
        setUserBrands(prev => [...prev, brand!]);
      } catch (error) {
        console.error('Error fetching brand:', error);
        setIsLoadingBrands(false);
        return;
      }
    }
    
    // Set loading state to show user that switch is happening
    setIsLoadingBrands(true);
    
    try {
      // Clear all sessionStorage caches to prevent stale data from previous brand
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('Failed to clear sessionStorage during brand switch:', e);
      }
      
      // Update state immediately for immediate UI feedback
      setCurrentBrand(brand);
      setCurrentWorkspace(brand.workspace || null);
      
      // Persist selected brand to localStorage
      try {
        localStorage.setItem('selectedBrandId', brandId);
        if (brand.workspace?.id) {
          localStorage.setItem('selectedWorkspaceId', brand.workspace.id);
        } else {
          localStorage.removeItem('selectedWorkspaceId');
        }
      } catch (error) {
        console.error('Failed to save selected brand to storage:', error);
      }
      
      // Update URL with brand parameter but don't reload
      const currentSearchParams = new URLSearchParams(window.location.search);
      currentSearchParams.set('brand', brandId);
      
      if (brand.workspace?.id) {
        currentSearchParams.set('workspace', brand.workspace.id);
      } else {
        currentSearchParams.delete('workspace');
      }
      
      // Check if we're on a brand-specific route that needs to be updated
      const brandRouteMatch = pathname.match(/^\/dashboard\/brands\/([^\/]+)(.*)$/);
      if (brandRouteMatch) {
        const [, currentBrandIdInPath, remainingPath] = brandRouteMatch;
        // If the brand ID in the path is different, navigate to the new brand's page
        if (currentBrandIdInPath !== brandId) {
          const newPath = `/dashboard/brands/${brandId}${remainingPath || ''}`;
          router.push(`${newPath}?${currentSearchParams.toString()}`);
        } else {
          // Same brand, just update URL without navigation
          router.replace(`${pathname}?${currentSearchParams.toString()}`);
        }
      } else {
        // For other routes, just update the URL params
        router.replace(`${pathname}?${currentSearchParams.toString()}`);
      }
      
      // Switch account if brand belongs to different account
      if (currentAccount?.id !== brand.account_id) {
        const accountUser = userAccounts.find(au => au.account_id === brand.account_id);
        if (accountUser) {
          setCurrentAccount(accountUser.account!);
        }
      }
      
      // Trigger custom event for other components to listen to brand changes
      window.dispatchEvent(new CustomEvent('brandChanged', { 
        detail: { 
          brand, 
          workspace: brand.workspace,
          previousBrand: currentBrand 
        } 
      }));
      
      // No reload needed - React state updates and SWR hooks will handle data fetching
      
    } catch (error) {
      console.error('Error switching brand:', error);
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const createBrand = async (brandData: Partial<Brand>): Promise<Brand | null> => {
    if (!user || !currentAccount || !supabase) return null;

    try {
      // Create brand
      const { data: brandResult, error: brandError } = await supabase
        .from('brands')
        .insert([
          {
            account_id: currentAccount.id,
            name: brandData.name,
            slug: brandData.slug || brandData.name?.toLowerCase().replace(/\s+/g, '-'),
            description: brandData.description,
            industry: brandData.industry,
            brand_type: brandData.brand_type || 'client',
            primary_domain: brandData.primary_domain,
            // Support both single category and multiple categories
            brand_category: brandData.industry || (brandData.brandCategories && brandData.brandCategories[0]),
            brand_categories: brandData.brandCategories,
          }
        ])
        .select()
        .single();

      if (brandError) {
        console.error('Error creating brand:', brandError);
        return null;
      }

      // Create default workspace for the brand
      const { data: workspaceResult, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          {
            account_id: currentAccount.id,
            brand_id: brandResult.id,
            name: `${brandResult.name} Workspace`,
            slug: `${brandResult.slug}-workspace`,
            description: `Default workspace for ${brandResult.name}`,
            is_default: true,
          }
        ])
        .select()
        .single();

      if (workspaceError) {
        console.error('Error creating workspace:', workspaceError);
      }

      // Refresh user data to include new brand
      await loadUserBrands();

      const newBrand = {
        ...brandResult,
        account: currentAccount,
        workspace: workspaceResult,
        manager_role: 'primary_manager'
      };

      return newBrand;
    } catch (error) {
      console.error('Error creating brand:', error);
      return null;
    }
  };

  const inviteUserToBrand = async (brandId: string, email: string, role: string): Promise<boolean> => {
    if (!user || !canInviteUsers(brandId)) return false;

    try {
      // Implementation would involve sending invitation email and creating pending brand_manager record
      return true;
    } catch (error) {
      console.error('Error inviting user to brand:', error);
      return false;
    }
  };

  const updateBrandSettings = async (brandId: string, settings: Partial<Brand>): Promise<boolean> => {
    if (!canManageBrand(brandId) || !supabase) return false;

    try {
      const { error } = await supabase
        .from('brands')
        .update(settings)
        .eq('id', brandId);

      if (error) {
        console.error('Error updating brand settings:', error);
        return false;
      }

      // Refresh user data
      await loadUserBrands();
      return true;
    } catch (error) {
      console.error('Error updating brand settings:', error);
      return false;
    }
  };

  const refreshUserData = async () => {
    await loadUserData();
  };

  // Utility functions
  const canCreateBrand = (accountId?: string): boolean => {
    const targetAccountId = accountId || currentAccount?.id;
    if (!targetAccountId) return false;
    
    const accountUser = userAccounts.find(au => au.account_id === targetAccountId);
    return accountUser?.role === 'owner' || accountUser?.role === 'admin';
  };

  const canManageBrand = (brandId: string): boolean => {
    const brand = userBrands.find(b => b.id === brandId);
    if (!brand) return false;
    
    return brand.manager_role === 'primary_manager' || brand.manager_role === 'manager';
  };

  const canInviteUsers = (brandId: string): boolean => {
    return canManageBrand(brandId);
  };

  const getBrandShareLink = (brandId: string): string => {
    return `${window.location.origin}/dashboard?brand=${brandId}`;
  };

  // Memoize context value to prevent unnecessary re-renders
  const value: BrandContextType = useMemo(() => ({
    // User and authentication
    user,
    profile,
    
    // Current selections
    currentAccount,
    currentBrand,
    currentWorkspace,
    
    // User's accessible data
    userAccounts,
    userBrands,
    userWorkspaces,
    
    // Loading states
    isLoading,
    isLoadingBrands,
    
    // Actions
    switchAccount,
    switchBrand,
    createBrand,
    inviteUserToBrand,
    updateBrandSettings,
    refreshUserData,
    
    // Utilities
    canCreateBrand,
    canManageBrand,
    canInviteUsers,
    getBrandShareLink,
  }), [
    user,
    profile,
    currentAccount,
    currentBrand,
    currentWorkspace,
    userAccounts,
    userBrands,
    userWorkspaces,
    isLoading,
    isLoadingBrands,
    switchAccount,
    switchBrand,
    createBrand,
    inviteUserToBrand,
    updateBrandSettings,
    refreshUserData,
    canCreateBrand,
    canManageBrand,
    canInviteUsers,
    getBrandShareLink
  ]);

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
}