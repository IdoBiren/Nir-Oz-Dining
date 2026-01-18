-- Add name column to user_roles
alter table user_roles add column if not exists name text;

-- Policy to allow users to update their own name (for the login sync)
create policy "Users can update own name" on user_roles
  for update
  using (user_email = auth.jwt() ->> 'email')
  with check (user_email = auth.jwt() ->> 'email');
  
-- If policy already exists or conflicts, this is fine. 
-- The important part is the column.

-- Optional: Allow inserting if they don't exist? 
-- The current app logic manually inserts roles via SQL.
-- We might want to allow the APP to insert a 'user' role row automatically on login if missing.
insert into user_roles (user_email, role, name)
values ('demo@example.com', 'user', 'Demo User')
on conflict (user_email) do update set name = excluded.name;
