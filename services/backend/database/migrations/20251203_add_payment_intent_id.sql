-- Add payment_intent_id column to orders table
-- This stores the Stripe payment intent ID for tracking payments

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255);

-- Create index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(payment_intent_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.payment_intent_id IS 'Stripe payment intent ID for tracking payment status';
