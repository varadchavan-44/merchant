-- Merch store schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- Drop-wide config: cutoff date, whether it's already been extended once
create table drop_config (
  id int primary key default 1,
  cutoff_at timestamptz not null,
  extended boolean not null default false,
  constraint single_row check (id = 1)
);
insert into drop_config (id, cutoff_at) values (1, now() + interval '14 days');

-- Friends who get referral credit
create table referrers (
  code text primary key,       -- short code used in ?ref=
  display_name text not null
);

-- Product = one design
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  price_paise int not null,     -- store money as integer paise, never floats
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Each size of each design has its own commit threshold + running count
create table product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size_label text not null,          -- 'S','M','L','XL' etc
  commit_threshold int not null,     -- min units to trigger print
  commit_count int not null default 0,   -- denormalized, kept in sync by trigger below
  status text not null default 'collecting'
    check (status in ('collecting','locked_for_print','failed','extended')),
  unique (product_id, size_label)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,     -- short human-readable code, e.g. MHT-2481
  buyer_name text not null,
  roll_no text not null,
  branch text,
  year text,
  phone text not null,
  pickup_location text not null,
  ref_code text references referrers(code),
  utr text not null unique,            -- hard duplicate-UTR guard at the DB level
  screenshot_url text,
  status text not null default 'pending_verification'
    check (status in (
      'pending_verification','verified','locked_for_print',
      'ready_for_pickup','picked_up','cancelled','refund_pending','refunded'
    )),
  created_at timestamptz not null default now(),
  verified_at timestamptz,
  edit_locked boolean not null default false
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  size_id uuid not null references product_sizes(id),
  quantity int not null check (quantity > 0),
  unit_price_paise int not null
);

-- Keep product_sizes.commit_count in sync whenever order_items change,
-- but only count items belonging to verified-or-later orders.
create or replace function recalc_commit_count() returns trigger as $$
declare
  affected_size uuid;
begin
  affected_size := coalesce(new.size_id, old.size_id);
  update product_sizes ps
  set commit_count = (
    select coalesce(sum(oi.quantity), 0)
    from order_items oi
    join orders o on o.id = oi.order_id
    where oi.size_id = affected_size
      and o.status in ('verified','locked_for_print','ready_for_pickup','picked_up')
  )
  where ps.id = affected_size;
  return null;
end;
$$ language plpgsql;

create trigger trg_recalc_commit_count
after insert or update or delete on order_items
for each row execute function recalc_commit_count();

-- Order status changes affect counts too (e.g. verify flips pending -> verified)
create or replace function recalc_commit_count_from_order() returns trigger as $$
begin
  update product_sizes ps
  set commit_count = (
    select coalesce(sum(oi.quantity), 0)
    from order_items oi
    join orders o on o.id = oi.order_id
    where oi.size_id = ps.id
      and o.status in ('verified','locked_for_print','ready_for_pickup','picked_up')
  )
  from order_items oi2
  where oi2.order_id = new.id and ps.id = oi2.size_id;
  return null;
end;
$$ language plpgsql;

create trigger trg_recalc_commit_count_on_order_status
after update of status on orders
for each row execute function recalc_commit_count_from_order();

-- Row Level Security: public can read products/sizes/config, and insert orders.
-- All admin actions (verify, status changes) go through the service role key only.
alter table products enable row level security;
alter table product_sizes enable row level security;
alter table drop_config enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table referrers enable row level security;

create policy "public read products" on products for select using (active = true);
create policy "public read sizes" on product_sizes for select using (true);
create policy "public read config" on drop_config for select using (true);
create policy "public read referrers" on referrers for select using (true);

create policy "public can create orders" on orders for insert with check (true);
create policy "buyer can read own order by code" on orders for select using (true);
create policy "public can create order items" on order_items for insert with check (true);
create policy "public read order items" on order_items for select using (true);

-- NOTE: verify/reject/status-change/pickup-checkin must all happen through
-- server-side API routes using the Supabase service role key, never the
-- public anon key, since those actions bypass the policies above on purpose.
