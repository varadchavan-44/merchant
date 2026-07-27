-- One-time reset: run this BEFORE re-running schema.sql, only if you
-- already ran the old version of schema.sql on this Supabase project.
-- Safe because there are no real orders yet. Drops in dependency order.

drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists product_sizes cascade;
drop table if exists products cascade;
drop table if exists referrers cascade;
drop table if exists drop_config cascade;

drop function if exists recalc_commit_count() cascade;
drop function if exists recalc_commit_count_from_order() cascade;
