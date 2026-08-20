-- Adds: multi-image product galleries, and per-unit name/number
-- customization on order items.
-- Run this in the Supabase SQL editor after the base schema.sql.

-- Gallery: one product can have several images, shown in sort order.
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  sort_order int not null default 0
);

alter table product_images enable row level security;
create policy "public read product images" on product_images for select using (true);

-- Whether buyers must supply a name + number to be printed on this product.
alter table products add column is_customizable boolean not null default false;

-- Per-unit customization. Customizable products are inserted into
-- order_items as one row per unit (quantity = 1 each) so every shirt
-- gets its own name/number; non-customizable items keep the existing
-- quantity > 1 rows and leave these columns null.
alter table order_items add column custom_name text;
alter table order_items add column custom_number text;
