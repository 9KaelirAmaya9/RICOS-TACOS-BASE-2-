-- Add vehicle and work order details to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS vehicle_year text,
ADD COLUMN IF NOT EXISTS vehicle_make text,
ADD COLUMN IF NOT EXISTS vehicle_model text,
ADD COLUMN IF NOT EXISTS vehicle_color text,
ADD COLUMN IF NOT EXISTS vehicle_license_plate text,
ADD COLUMN IF NOT EXISTS vehicle_mileage integer,
ADD COLUMN IF NOT EXISTS vehicle_vin text,
ADD COLUMN IF NOT EXISTS technician_name text,
ADD COLUMN IF NOT EXISTS reference_number text,
ADD COLUMN IF NOT EXISTS parts_needed text,
ADD COLUMN IF NOT EXISTS customer_deposit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS labor_hours numeric,
ADD COLUMN IF NOT EXISTS labor_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS parts_total numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method text;