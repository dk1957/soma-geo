-- Fix infinite recursion in account_users policies
-- Drop existing problematic policies and create simpler ones

-- Drop the existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view account memberships they're part of" ON public.account_users;
DROP POLICY IF EXISTS "Users can view workspace memberships they're part of" ON public.workspace_users;

-- Create simpler policies without complex joins
CREATE POLICY "Users can view their own account memberships" ON public.account_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Account admins can view all memberships in their account" ON public.account_users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM public.accounts WHERE id = account_id
    )
  );

CREATE POLICY "Users can insert account memberships for accounts they own" ON public.account_users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.accounts WHERE id = account_id
    )
  );

CREATE POLICY "Users can update their own account membership" ON public.account_users
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Account owners can update any membership in their account" ON public.account_users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM public.accounts WHERE id = account_id
    )
  );

-- Create simpler workspace user policies
CREATE POLICY "Users can view their own workspace memberships" ON public.workspace_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Workspace admins can view all memberships in their workspace" ON public.workspace_users
  FOR SELECT USING (
    auth.uid() IN (
      SELECT w.account_id FROM public.workspaces w 
      JOIN public.accounts a ON w.account_id = a.id
      WHERE w.id = workspace_id AND a.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workspace memberships for workspaces they own" ON public.workspace_users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT a.owner_id FROM public.workspaces w 
      JOIN public.accounts a ON w.account_id = a.id
      WHERE w.id = workspace_id
    )
  );

-- Fix account insertion policy
CREATE POLICY "Users can create accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Add account user insertion trigger to automatically add owner
CREATE OR REPLACE FUNCTION public.handle_new_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the account owner as the first account user with owner role
  INSERT INTO public.account_users (account_id, user_id, role, joined_at, is_active)
  VALUES (NEW.id, NEW.owner_id, 'owner', now(), true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_account_created ON public.accounts;

-- Create the trigger
CREATE TRIGGER on_account_created
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_account();