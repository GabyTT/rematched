# User roles

Every signed-in Supabase user has buyer access. `seller`, `advertiser`, and
`admin` are additive elevated roles stored in `public.user_roles`; users can
read only their own assignments and cannot write to that table through the
anon/authenticated client.

To grant the current project owner admin access, first find their UUID in
`auth.users`, then run this in the Supabase SQL editor as a database owner:

```sql
insert into public.user_roles (user_id, role)
values ('<auth.users.id>', 'admin')
on conflict do nothing;
```

Grant another capability by changing the role to `seller` or `advertiser`.
Multiple rows for the same `user_id` are supported.
