-- Fix account access for owners
-- Allow account owners to view accounts they own directly

-- Drop existing account policies to recreate them properly
DROP POLICY IF EXISTS "Users can view accounts they belong to" ON public.accounts;
DROP POLICY IF EXISTS "Account owners can update their accounts" ON public.accounts;

-- Create new policies that allow both ownership and membership access
CREATE POLICY "Users can view accounts they own or belong to" ON public.accounts
  FOR SELECT USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM public.account_users 
      WHERE account_users.account_id = accounts.id 
      AND account_users.user_id = auth.uid()
      AND account_users.is_active = true
    )
  );

CREATE POLICY "Account owners can update their accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = owner_id);

-- Also ensure brands can be accessed by account owners
DROP POLICY IF EXISTS "Users can view brands in their accounts" ON public.brands;

CREATE POLICY "Users can view brands in accounts they own or belong to" ON public.brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts 
      WHERE accounts.id = brands.account_id
      AND (accounts.owner_clerk_id = (auth.jwt() ->> 'sub') OR
           EXISTS (
             SELECT 1 FROM public.account_users 
             WHERE account_users.account_id = accounts.id 
             AND account_users.clerk_id = (auth.jwt() ->> 'sub')
             AND account_users.is_active = true
           ))
    )
  );