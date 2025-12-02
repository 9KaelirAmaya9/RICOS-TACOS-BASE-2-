-- Make client_id optional in orders table to fix foreign key constraint error
ALTER TABLE public.orders 
ALTER COLUMN client_id DROP NOT NULL;

-- Drop the foreign key constraint
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS orders_client_id_fkey;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.client_id IS 'Optional reference to clients table. Can be NULL for direct work orders.';