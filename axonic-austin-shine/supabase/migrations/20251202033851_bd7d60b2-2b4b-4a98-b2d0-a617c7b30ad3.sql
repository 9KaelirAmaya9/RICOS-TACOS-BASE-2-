-- Add signature-related columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS invoice_pdf_url text,
ADD COLUMN IF NOT EXISTS agreement_pdf_url text,
ADD COLUMN IF NOT EXISTS agreement_signed_pdf_url text,
ADD COLUMN IF NOT EXISTS agreement_signed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS agreement_signed_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS agreement_signed_by text,
ADD COLUMN IF NOT EXISTS signature_data text;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.invoice_pdf_url IS 'Client-facing invoice PDF URL';
COMMENT ON COLUMN public.orders.agreement_pdf_url IS 'Unsigned client services agreement PDF URL';
COMMENT ON COLUMN public.orders.agreement_signed_pdf_url IS 'Signed client services agreement PDF URL';
COMMENT ON COLUMN public.orders.agreement_signed IS 'Whether the client has signed the agreement';
COMMENT ON COLUMN public.orders.agreement_signed_date IS 'Timestamp when agreement was signed';
COMMENT ON COLUMN public.orders.agreement_signed_by IS 'Name of person who signed the agreement';
COMMENT ON COLUMN public.orders.signature_data IS 'Base64 encoded signature image data';