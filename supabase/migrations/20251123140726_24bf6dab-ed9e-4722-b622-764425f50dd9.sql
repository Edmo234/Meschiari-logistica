-- Drop all policies that depend on user_type
DROP POLICY IF EXISTS "Empresas can create orders" ON orders;
DROP POLICY IF EXISTS "Empresas can view own orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view available orders" ON orders;
DROP POLICY IF EXISTS "Can update assigned orders" ON orders;

-- Add entregador to user_type enum
ALTER TYPE user_type RENAME TO user_type_old;
CREATE TYPE user_type AS ENUM ('cliente', 'empresa', 'entregador');

-- Update profiles table
ALTER TABLE profiles ALTER COLUMN user_type TYPE user_type USING user_type::text::user_type;

-- Drop old enum
DROP TYPE user_type_old;

-- Recreate policies
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

CREATE POLICY "Clientes can view orders"
ON orders
FOR SELECT
TO authenticated
USING (
  customer_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND user_type = 'cliente'
  )
);

CREATE POLICY "Entregadores can view all pending orders"
ON orders
FOR SELECT
TO authenticated
USING (
  status = 'pending' OR 
  delivery_person_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND user_type = 'entregador'
  )
);

CREATE POLICY "Entregadores can update assigned orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  delivery_person_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid() AND user_type = 'entregador'
  )
);