-- Create storage bucket for work order PDFs and signatures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'work-order-pdfs',
  'work-order-pdfs',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
);

-- RLS policies for work-order-pdfs bucket
CREATE POLICY "Admins can upload PDFs and signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-order-pdfs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can view all PDFs and signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-order-pdfs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Clients can view their own PDFs and signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-order-pdfs'
  AND (storage.foldername(name))[1] IN (
    SELECT o.id::text
    FROM orders o
    JOIN clients c ON o.client_id = c.id
    WHERE c.user_id = auth.uid()
  )
);

-- Add signature and PDF columns to service_agreements table
ALTER TABLE service_agreements
ADD COLUMN IF NOT EXISTS signature_url text,
ADD COLUMN IF NOT EXISTS pdf_url text;