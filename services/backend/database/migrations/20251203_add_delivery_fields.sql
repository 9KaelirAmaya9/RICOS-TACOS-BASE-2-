-- Add delivery fields to orders table
-- Supports both pickup and delivery orders with address validation

-- Add delivery address fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_street VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_unit VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_state VARCHAR(2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_zip VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_lat DECIMAL(10, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_lng DECIMAL(11, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_distance_miles DECIMAL(6, 2);

-- Create indexes for delivery queries
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_zip ON orders(delivery_address_zip);

-- Add comments for documentation
COMMENT ON COLUMN orders.delivery_address_street IS 'Street address for delivery orders';
COMMENT ON COLUMN orders.delivery_address_unit IS 'Apartment/unit number';
COMMENT ON COLUMN orders.delivery_address_city IS 'City for delivery';
COMMENT ON COLUMN orders.delivery_address_state IS 'State abbreviation (e.g., CA, TX)';
COMMENT ON COLUMN orders.delivery_address_zip IS 'ZIP code for delivery';
COMMENT ON COLUMN orders.delivery_address_lat IS 'Latitude for distance calculation';
COMMENT ON COLUMN orders.delivery_address_lng IS 'Longitude for distance calculation';
COMMENT ON COLUMN orders.delivery_fee IS 'Calculated delivery fee based on distance';
COMMENT ON COLUMN orders.delivery_instructions IS 'Special delivery instructions from customer';
COMMENT ON COLUMN orders.delivery_distance_miles IS 'Distance from restaurant in miles';
