-- Fix recursive RLS policies on user_roles causing infinite recursion errors

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop recursive admin policies that reference user_roles from within policies
DROP POLICY IF EXISTS "Admins can manage user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Keep existing per-user read policy:
-- "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- Note: Admin management of roles is handled exclusively via backend functions
-- using the service role key, which bypass RLS. Authenticated clients cannot
-- directly modify user_roles via the public API.