-- Add pdf_url column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pdf_url text;

-- Create work-order-pdfs bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-order-pdfs', 'work-order-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for work-order-pdfs bucket
CREATE POLICY "Public access to work order PDFs"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'work-order-pdfs');

CREATE POLICY "Authenticated users can upload work order PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'work-order-pdfs');

CREATE POLICY "Users can delete their work order PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'work-order-pdfs');