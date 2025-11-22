-- Update user_type enum to have cliente and empresa
ALTER TYPE user_type RENAME TO user_type_old;
CREATE TYPE user_type AS ENUM ('cliente', 'empresa');

-- Update profiles table to use new enum
ALTER TABLE profiles ALTER COLUMN user_type TYPE user_type USING user_type::text::user_type;

-- Drop old enum
DROP TYPE user_type_old;

-- Update orders table to add empresa_id
ALTER TABLE orders ADD COLUMN empresa_id uuid REFERENCES profiles(id);

-- Update RLS policies for orders
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Delivery persons can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Delivery persons can view available and assigned orders" ON orders;

-- New policies for empresa creating orders
CREATE POLICY "Empresas can create orders"
ON orders
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND user_type = 'empresa'
  )
);

CREATE POLICY "Empresas can view own orders"
ON orders
FOR SELECT
TO authenticated
USING (
  empresa_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND user_type = 'empresa'
  )
);

-- Delivery persons can view all pending orders and their assigned orders
CREATE POLICY "Anyone can view available orders"
ON orders
FOR SELECT
TO authenticated
USING (status = 'pending' OR delivery_person_id IS NOT NULL);

-- Delivery persons can update orders assigned to them
CREATE POLICY "Can update assigned orders"
ON orders
FOR UPDATE
TO authenticated
USING (delivery_person_id IS NOT NULL);