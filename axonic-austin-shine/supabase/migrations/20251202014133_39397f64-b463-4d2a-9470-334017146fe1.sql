-- FIX 1: Create work-orders storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-orders', 'work-orders', true)
ON CONFLICT (id) DO NOTHING;

-- FIX 2: Enable RLS on work_orders table
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- FIX 3: Create policies for work_orders TABLE
CREATE POLICY "Admins can manage all work orders"
ON work_orders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Employees can create work orders"
ON work_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Employees can view own work orders"
ON work_orders
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Employees can update own work orders"
ON work_orders
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);