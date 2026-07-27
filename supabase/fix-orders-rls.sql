-- Run this in the Supabase SQL editor immediately — closes public
-- read/write access to the orders and order_items tables. Nothing in
-- the app breaks: every route touching these tables already uses the
-- service-role key server-side, which bypasses RLS regardless of policy.

drop policy if exists "public can create orders" on orders;
drop policy if exists "buyer can read own order by code" on orders;
drop policy if exists "public can create order items" on order_items;
drop policy if exists "public read order items" on order_items;

-- Sanity check: this should return zero rows. If it returns anything,
-- something is still granting public/anon access.
select schemaname, tablename, policyname, roles
from pg_policies
where tablename in ('orders', 'order_items');
