-- 1. Schema Fix: Add 'name' column if it's missing
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS name text;

-- 2. Insert or Update roles for test users
INSERT INTO user_roles (user_email, role, name)
VALUES 
  ('niroz.test.admin@gmail.com', 'admin', 'Test Admin'),
  ('niroz.test.manager@gmail.com', 'group_order', 'Test Manager'),
  ('niroz.test.user@gmail.com', 'user', 'Test User')
ON CONFLICT (user_email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  name = EXCLUDED.name;

-- 3. POLICY: Allow Admins to update roles (Change Staff)
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;

CREATE POLICY "Admins can update roles" ON user_roles
  FOR UPDATE
  USING (
    (SELECT role FROM user_roles WHERE user_email = auth.jwt() ->> 'email') = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_roles WHERE user_email = auth.jwt() ->> 'email') = 'admin'
  );

-- 4. POLICY: Allow new users to insert their own role
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;

CREATE POLICY "Users can insert own role" ON user_roles
  FOR INSERT
  WITH CHECK (
    user_email = auth.jwt() ->> 'email'
    AND role = 'user'
  );

-- 5. POLICY: Allow users to update their own name
DROP POLICY IF EXISTS "Users can update own name" ON user_roles;

CREATE POLICY "Users can update own name" ON user_roles
  FOR UPDATE
  USING (user_email = auth.jwt() ->> 'email')
  WITH CHECK (user_email = auth.jwt() ->> 'email');
