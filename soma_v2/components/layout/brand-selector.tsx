'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Plus, Settings, Users, Building2, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandCreationDialog } from '@/components/brand-creation-dialog';
import { QuotaLimitDialog } from '@/components/subscription/quota-limit-dialog';
import { useToast } from '@/components/layout/notification-toast';
import { useBrand, type Brand } from '@/lib/contexts/brand-context';
import { useCanPerformAction } from '@/hooks/use-subscription';

function getCompanyDisplayName(brand: Brand, fallbackAccountName?: string): string {
  // 1. Direct company_name on the brand (set during onboarding/creation)
  if (brand.company_name?.trim()) return brand.company_name.trim();
  // 2. Account name from the joined relation
  if (brand.account?.name?.trim()) return brand.account.name.trim();
  // 3. Fallback to the current account name (covers in-house accounts)
  if (fallbackAccountName?.trim()) return fallbackAccountName.trim();
  return 'No company';
}

export function BrandSelector() {
  const router = useRouter();
  const {
    currentBrand,
    currentAccount,
    userBrands,
    isLoadingBrands,
    switchBrand,
    canCreateBrand,
    canManageBrand,
    canInviteUsers,
    inviteUserToBrand,
    refreshUserData
  } = useBrand();

  const { addToast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [agencyEnabled, setAgencyEnabled] = useState<boolean | null>(null);

  // Fetch feature flags to determine if agency mode (multi-brand) is enabled
  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const res = await fetch('/api/admin/feature-flags');
        const data = await res.json();
        setAgencyEnabled(data.flags?.agency_mode?.enabled ?? true);
      } catch {
        setAgencyEnabled(true);
      }
    };
    fetchFlags();
  }, []);

  // Pre-check brand creation quota
  const { canPerform: canCreateMore, current: brandCount, max: brandMax, loading: quotaLoading, planName: brandPlanName, planTier: brandPlanTier } = useCanPerformAction(
    'create_brand',
    currentAccount?.id
  );

  const handleCreateBrandClick = () => {
    if (!canCreateMore && !quotaLoading) {
      setShowQuotaDialog(true);
      return;
    }
    setShowCreateDialog(true);
  };

  // Listen for brand switching events to show feedback
  useEffect(() => {
    const handleBrandChanged = (event: CustomEvent) => {
      const { brand } = event.detail;
      addToast({
        type: 'success',
        title: 'Brand switched',
        message: `Now viewing ${brand.name}`,
        duration: 3000
      });
    };

    window.addEventListener('brandChanged', handleBrandChanged as EventListener);
    
    return () => {
      window.removeEventListener('brandChanged', handleBrandChanged as EventListener);
    };
  }, [addToast]);

  // Invite User Form State
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'collaborator',
  });

  const handleSwitchBrand = async (brandId: string) => {
    if (isSwitching || brandId === currentBrand?.id) return;
    
    setIsSwitching(true);
    
    try {
      addToast({
        type: 'info',
        title: 'Switching brand...',
        message: 'Please wait while we switch your brand context.',
        duration: 2000
      });
      
      // Note: switchBrand will reload the page, so no need to reset isSwitching
      await switchBrand(brandId);
    } catch (error) {
      console.error('Error switching brand:', error);
      addToast({
        type: 'error',
        title: 'Brand switch failed',
        message: 'Failed to switch brand. Please try again.',
        duration: 5000
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleBrandCreated = async (brandData: any) => {
    // Refresh brands list and switch to the new brand
    console.log('Brand created successfully:', brandData);
    
    try {
      // Refresh the brands list
      await refreshUserData();
      
      // Navigate to the new brand
      if (brandData?.id && brandData?.workspaces?.[0]?.id) {
        const brandId = brandData.id;
        const workspaceId = brandData.workspaces[0].id;
        
        // Use router to navigate to the new brand
        router.push(`/dashboard/brands/${brandId}?workspace=${workspaceId}`);
        
        // Show success toast
        addToast({
          type: 'success',
          title: 'Brand created',
          message: `Successfully created ${brandData.name} and switched to it.`,
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error after brand creation:', error);
      addToast({
        type: 'error',
        title: 'Navigation failed',
        message: 'Brand created but failed to switch to it. Please refresh the page.',
        duration: 5000
      });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteForm.email.trim() || !currentBrand) return;

    setIsInviting(true);
    try {
      const success = await inviteUserToBrand(currentBrand.id, inviteForm.email, inviteForm.role);
      if (success) {
        setShowInviteDialog(false);
        setInviteForm({ email: '', role: 'collaborator' });
      }
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoadingBrands) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        <span className="text-xs text-muted-foreground">Loading brands...</span>
      </div>
    );
  }

  if (!userBrands || userBrands.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="text-sm">No brands found</span>
        {agencyEnabled && canCreateBrand() && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateBrandClick}
            className="ml-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create Brand
          </Button>
        )}
      </div>
    );
  }

  if (!currentBrand) {
    // Show loading state if we have brands but no current brand selected yet
    // This happens during the initial brand selection process
    if (userBrands && userBrands.length > 0) {
      return (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading brand...</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Building2 className="w-4 h-4" />
        <span className="text-sm">No brand selected</span>
        {userBrands && userBrands.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              handleSwitchBrand(userBrands[0].id);
            }}
            className="ml-2"
            disabled={isSwitching}
          >
            {isSwitching ? 'Selecting...' : 'Select Brand'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Brand Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="flex items-center space-x-2 h-10 px-3 border-gray-200 hover:border-gray-300 hover:bg-transparent hover:text-black cursor-pointer"
            disabled={isSwitching}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={currentBrand.logo_url} alt={currentBrand.name} />
              <AvatarFallback className="text-xs">
                {currentBrand.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium truncate max-w-32">
                {isSwitching ? 'Switching...' : currentBrand.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {getCompanyDisplayName(currentBrand, currentAccount?.name)}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground ${isSwitching ? 'animate-spin' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">Brand Selection</p>
              <p className="text-xs text-muted-foreground">
                {currentAccount?.name} • {userBrands.length} brands
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Brand List */}
          <div className="max-h-64 overflow-y-auto">
            {userBrands.map((brand) => (
              <DropdownMenuItem
                key={brand.id}
                className="flex items-center space-x-3 p-3 cursor-pointer"
                onClick={() => handleSwitchBrand(brand.id)}
                disabled={isSwitching || brand.id === currentBrand.id}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={brand.logo_url} alt={brand.name} />
                  <AvatarFallback className="text-xs">
                    {brand.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">{brand.name}</p>
                    {brand.id === currentBrand.id && (
                      <Badge variant="secondary" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-muted-foreground truncate">
                      {getCompanyDisplayName(brand, currentAccount?.name)}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {brand.manager_role}
                    </Badge>
                  </div>
                </div>
                {isSwitching && (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
          
          <DropdownMenuSeparator />
          
          {/* Essential Brand Actions */}
          <DropdownMenuLabel>Brand Actions</DropdownMenuLabel>
          
          {agencyEnabled && canCreateBrand() && (
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault();
                handleCreateBrandClick();
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Brand
              {!quotaLoading && brandMax > 0 && (
                <span className={`ml-auto text-xs ${brandCount >= brandMax ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {brandCount}/{brandMax}
                </span>
              )}
            </DropdownMenuItem>
          )}
          
          {currentBrand && canManageBrand(currentBrand.id) && (
            <>
              <DropdownMenuItem asChild>
                <a href={`/dashboard/brands/${currentBrand.id}/settings`} className="flex items-center w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Brand Settings
                </a>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <a href="/dashboard/reports" className="flex items-center w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </a>
              </DropdownMenuItem>
              
              {canInviteUsers(currentBrand.id) && (
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Users className="w-4 h-4 mr-2" />
                      Invite Team Members
                    </DropdownMenuItem>
                  </DialogTrigger>
                </Dialog>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Brand Dialog - Use new comprehensive dialog */}
      <BrandCreationDialog 
        open={showCreateDialog} 
        onCloseAction={() => setShowCreateDialog(false)}
        onSuccessAction={handleBrandCreated}
      />

      {/* Quota Limit Dialog - shown when brand limit reached */}
      <QuotaLimitDialog
        open={showQuotaDialog}
        onClose={() => setShowQuotaDialog(false)}
        resourceType="brand"
        currentCount={brandCount}
        maxCount={brandMax}
        planName={brandPlanName}
        planTier={brandPlanTier}
      />

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Teammate</DialogTitle>
            <DialogDescription>
              Invite a teammate to collaborate on {currentBrand.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Email Address *</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="teammate@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="collaborator">Collaborator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInviteUser}
                disabled={!inviteForm.email.trim() || isInviting}
              >
                {isInviting ? 'Sending...' : 'Send Invite'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}