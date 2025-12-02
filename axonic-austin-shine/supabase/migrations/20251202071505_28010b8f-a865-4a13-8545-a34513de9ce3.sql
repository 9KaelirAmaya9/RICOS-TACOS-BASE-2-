-- Update work order number generation to use simple sequential format WO-0001, WO-0002, etc.
CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  wo_number TEXT;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM 4) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.work_orders
  WHERE work_order_number ~ '^WO-[0-9]+$';
  
  -- Format as WO-0001, WO-0002, etc.
  wo_number := 'WO-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN wo_number;
END;
$function$;

-- Update invoice number generation to use simple sequential format (matching work orders style)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get the next sequential number
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.orders
  WHERE invoice_number ~ '^INV-[0-9]+$';
  
  -- Format as INV-0001, INV-0002, etc.
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$function$;