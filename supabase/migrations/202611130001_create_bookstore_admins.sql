-- BookStore admin role and protected order-management RPCs.
-- Run this migration in the Supabase SQL Editor before using /admin.
-- Admins are added manually by a project owner; browser users cannot grant themselves a role.

create table if not exists public.bookstore_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.bookstore_admins enable row level security;
revoke all on table public.bookstore_admins from anon, authenticated;

create or replace function public.is_bookstore_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.bookstore_admins
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_bookstore_admin() from public, anon;
grant execute on function public.is_bookstore_admin() to authenticated;

create or replace function public.admin_get_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_bookstore_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select pg_catalog.jsonb_build_object(
    'totalOrders', count(*),
    'processingOrders', count(*) filter (where order_status = 'processing'),
    'demoRevenueCents', coalesce(
      sum(total_cents) filter (
        where payment_status = 'succeeded_demo' and order_status <> 'cancelled'
      ), 0
    ),
    'customerCount', count(distinct user_id),
    'orders', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(order_row))
      from (
        select
          id, order_number, user_id, created_at,
          subtotal_cents, shipping_cents, total_cents,
          payment_method, payment_status, order_status,
          shipping_address, items
        from public.bookstore_orders
        order by created_at desc
        limit 100
      ) as order_row
    ), '[]'::jsonb)
  )
  into v_result
  from public.bookstore_orders;

  return v_result;
end;
$$;

revoke all on function public.admin_get_overview() from public, anon;
grant execute on function public.admin_get_overview() to authenticated;

create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_order_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.bookstore_orders;
begin
  if not public.is_bookstore_admin() then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_order_status not in ('processing', 'shipped', 'delivered', 'cancelled') then
    raise exception 'INVALID_ORDER_STATUS';
  end if;

  update public.bookstore_orders
  set order_status = p_order_status
  where id = p_order_id
  returning * into v_order;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  return pg_catalog.jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'order_status', v_order.order_status
  );
end;
$$;

revoke all on function public.admin_update_order_status(uuid, text) from public, anon;
grant execute on function public.admin_update_order_status(uuid, text) to authenticated;
