-- Create work orders table
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year TEXT,
  vehicle_vin TEXT,
  services_requested TEXT[] DEFAULT '{}',
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own work orders
CREATE POLICY "Users can view their own work orders"
ON public.work_orders
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- Admins can view all work orders
CREATE POLICY "Admins can view all work orders"
ON public.work_orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can create their own work orders
CREATE POLICY "Users can create work orders"
ON public.work_orders
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Admins can update all work orders
CREATE POLICY "Admins can update all work orders"
ON public.work_orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete work orders
CREATE POLICY "Admins can delete work orders"
ON public.work_orders
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_work_orders_updated_at
BEFORE UPDATE ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create function to generate work order numbers
CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_prefix TEXT;
  next_number INTEGER;
  wo_number TEXT;
BEGIN
  date_prefix := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM 15) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.work_orders
  WHERE work_order_number LIKE date_prefix || '-%';
  
  wo_number := date_prefix || '-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN wo_number;
END;
$$;

-- Create trigger to auto-generate work order number
CREATE OR REPLACE FUNCTION public.set_work_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.work_order_number IS NULL OR NEW.work_order_number = '' THEN
    NEW.work_order_number := public.generate_work_order_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_work_order_number_trigger
BEFORE INSERT ON public.work_orders
FOR EACH ROW
EXECUTE FUNCTION public.set_work_order_number();