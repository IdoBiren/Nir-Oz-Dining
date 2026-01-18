-- 1. Confirm the test users so they can log in immediately
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email IN (
  'niroz.test.admin@gmail.com',
  'niroz.test.manager@gmail.com',
  'niroz.test.user@gmail.com'
);

-- 2. Schema Fix: Add 'name' column if it's missing (Safe to run multiple times)
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS name text;

-- 3. Insert or Update roles for these test users
INSERT INTO public.user_roles (user_email, role, name)
VALUES 
  ('niroz.test.admin@gmail.com', 'admin', 'Test Admin'),
  ('niroz.test.manager@gmail.com', 'group_order', 'Test Manager'),
  ('niroz.test.user@gmail.com', 'user', 'Test User')
ON CONFLICT (user_email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  name = EXCLUDED.name;
