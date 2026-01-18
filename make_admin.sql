-- Promote specific user to Admin
insert into user_roles (user_email, role, name)
values ('idobi.renboim.ido@gmail.com', 'admin', 'Ido Renboim')
on conflict (user_email) 
do update set role = 'admin';

-- Verify the change (Run this separately or check Table Editor)
-- select * from user_roles where user_email = 'idobi.renboim.ido@gmail.com';
