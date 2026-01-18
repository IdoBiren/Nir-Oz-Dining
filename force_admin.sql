-- Force update existing user to admin
UPDATE user_roles 
SET role = 'admin' 
WHERE user_email = 'idobi.renboim.ido@gmail.com';

-- Check the result
SELECT * FROM user_roles WHERE user_email = 'idobi.renboim.ido@gmail.com';
