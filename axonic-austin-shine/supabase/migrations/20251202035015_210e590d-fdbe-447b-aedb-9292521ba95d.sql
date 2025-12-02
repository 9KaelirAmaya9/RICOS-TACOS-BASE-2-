-- Add customer information columns to orders table
-- This allows storing customer data directly in work orders without requiring client records

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS customer_email text,
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_address text;

-- Add comments
COMMENT ON COLUMN public.orders.customer_name IS 'Customer name stored directly in order (for work orders without client records)';
COMMENT ON COLUMN public.orders.customer_email IS 'Customer email stored directly in order (for work orders without client records)';
COMMENT ON COLUMN public.orders.customer_phone IS 'Customer phone stored directly in order (for work orders without client records)';
COMMENT ON COLUMN public.orders.customer_address IS 'Customer address stored directly in order (for work orders without client records)';