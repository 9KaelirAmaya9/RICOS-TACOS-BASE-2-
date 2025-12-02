-- Drop existing restrictive policies on clients table
DROP POLICY IF EXISTS "Admins can do everything with clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view their own client record" ON public.clients;

-- Create proper PERMISSIVE policies for clients table
-- Admins have full access
CREATE POLICY "Admins can manage all clients" 
ON public.clients 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can only view their own client record
CREATE POLICY "Users can view own client record" 
ON public.clients 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own client record
CREATE POLICY "Users can update own client record" 
ON public.clients 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());