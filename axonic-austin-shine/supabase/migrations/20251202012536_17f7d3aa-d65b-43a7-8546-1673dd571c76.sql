-- Step 1: Create storage bucket for work orders
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-orders', 'work-orders', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add columns to work_orders table
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vehicle_color text;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vehicle_license_plate text;

-- Step 3: Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: RLS Policies for Storage Bucket
-- Admins can upload anywhere
CREATE POLICY "Admins can upload work order PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-orders' AND
  public.is_admin(auth.uid())
);

-- Admins can view all PDFs
CREATE POLICY "Admins can view all work order PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-orders' AND
  public.is_admin(auth.uid())
);

-- Employees can upload to their own folder (userid/filename.pdf)
CREATE POLICY "Employees can upload their own work order PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-orders' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Employees can view PDFs in their own folder
CREATE POLICY "Employees can view their own work order PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-orders' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can delete any PDF
CREATE POLICY "Admins can delete work order PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-orders' AND
  public.is_admin(auth.uid())
);

-- Employees can delete their own PDFs
CREATE POLICY "Employees can delete their own work order PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-orders' AND
  (storage.foldername(name))[1] = auth.uid()::text
);