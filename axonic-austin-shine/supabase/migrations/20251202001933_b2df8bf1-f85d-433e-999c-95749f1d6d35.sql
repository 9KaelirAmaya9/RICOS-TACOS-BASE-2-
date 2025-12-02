-- Update storage bucket to allow HTML files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'text/html']
WHERE id = 'work-order-pdfs';