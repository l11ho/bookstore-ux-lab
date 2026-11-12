-- BookStore international demo checkout.
-- Prices are stored as USD cents. This is a simulation; no real payment is processed.

create table if not exists public.bookstore_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  currency text not null default 'USD' check (currency = 'USD'),
  subtotal_cents integer not null check (subtotal_cents >= 0),
  shipping_cents integer not null check (shipping_cents >= 0),
  total_cents integer not null check (total_cents = subtotal_cents + shipping_cents),
  payment_method text not null check (payment_method in ('demo_card', 'demo_paypal')),
  payment_status text not null check (payment_status = 'succeeded_demo'),
  order_status text not null default 'processing'
    check (order_status in ('processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address jsonb not null,
  items jsonb not null,
  demo_mode boolean not null default true check (demo_mode is true),
  created_at timestamptz not null default now()
);

alter table public.bookstore_orders enable row level security;

revoke all on table public.bookstore_orders from anon, authenticated;
grant select on table public.bookstore_orders to authenticated;

drop policy if exists "Users can read their own bookstore orders" on public.bookstore_orders;
create policy "Users can read their own bookstore orders"
  on public.bookstore_orders
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists bookstore_orders_user_created_idx
  on public.bookstore_orders (user_id, created_at desc);

create or replace function public.create_bookstore_demo_order(
  p_order_number text,
  p_payment_method text,
  p_shipping_address jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_item jsonb;
  v_book_id integer;
  v_quantity integer;
  v_price_cents integer;
  v_title text;
  v_author text;
  v_items jsonb := '[]'::jsonb;
  v_subtotal_cents integer := 0;
  v_shipping_cents integer;
  v_order public.bookstore_orders;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_order_number is null or length(p_order_number) < 8 or length(p_order_number) > 60 then
    raise exception 'INVALID_ORDER_NUMBER';
  end if;
  if p_payment_method not in ('demo_card', 'demo_paypal') then
    raise exception 'INVALID_DEMO_PAYMENT_METHOD';
  end if;
  if pg_catalog.jsonb_typeof(p_shipping_address) is distinct from 'object' then
    raise exception 'INVALID_SHIPPING_ADDRESS';
  end if;
  if coalesce(pg_catalog.btrim(p_shipping_address ->> 'full_name'), '') = ''
    or coalesce(pg_catalog.btrim(p_shipping_address ->> 'email'), '') = ''
    or coalesce(pg_catalog.btrim(p_shipping_address ->> 'phone'), '') = ''
    or coalesce(pg_catalog.btrim(p_shipping_address ->> 'address_line1'), '') = ''
    or coalesce(pg_catalog.btrim(p_shipping_address ->> 'city'), '') = ''
    or coalesce(pg_catalog.btrim(p_shipping_address ->> 'postal_code'), '') = ''
    or length(coalesce(p_shipping_address ->> 'country', '')) <> 2 then
    raise exception 'INCOMPLETE_SHIPPING_ADDRESS';
  end if;
  if pg_catalog.jsonb_typeof(p_items) is distinct from 'array'
    or pg_catalog.jsonb_array_length(p_items) < 1
    or pg_catalog.jsonb_array_length(p_items) > 20 then
    raise exception 'INVALID_ORDER_ITEMS';
  end if;

  for v_item in
    select value from pg_catalog.jsonb_array_elements(p_items) as line(value)
  loop
    v_book_id := (v_item ->> 'id')::integer;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity < 1 or v_quantity > 10 then
      raise exception 'INVALID_ITEM_QUANTITY';
    end if;

    case v_book_id
      when 1 then v_title := 'Чистый код'; v_author := 'Robert C. Martin'; v_price_cents := 1890;
      when 2 then v_title := 'Атомные привычки'; v_author := 'James Clear'; v_price_cents := 1490;
      when 3 then v_title := 'Глубокая работа'; v_author := 'Cal Newport'; v_price_cents := 1590;
      when 4 then v_title := 'Прагматичный программист'; v_author := 'Andrew Hunt'; v_price_cents := 2290;
      when 5 then v_title := 'Думай медленно… решай быстро'; v_author := 'Daniel Kahneman'; v_price_cents := 1990;
      when 6 then v_title := 'Психология влияния'; v_author := 'Robert B. Cialdini'; v_price_cents := 1690;
      when 7 then v_title := 'Sapiens. Краткая история человечества'; v_author := 'Yuval Noah Harari'; v_price_cents := 2190;
      when 8 then v_title := 'Краткая история времени'; v_author := 'Stephen Hawking'; v_price_cents := 1390;
      when 9 then v_title := 'Дизайн привычных вещей'; v_author := 'Don Norman'; v_price_cents := 1790;
      when 10 then v_title := 'Маленький принц'; v_author := 'Antoine de Saint-Exupéry'; v_price_cents := 990;
      when 11 then v_title := 'Искусство цвета'; v_author := 'Johannes Itten'; v_price_cents := 2490;
      when 12 then v_title := 'Начни с почему'; v_author := 'Simon Sinek'; v_price_cents := 1390;
      when 13 then v_title := 'Эссенциализм'; v_author := 'Greg McKeown'; v_price_cents := 1290;
      when 14 then v_title := 'Гарри Поттер и философский камень'; v_author := 'J. K. Rowling'; v_price_cents := 1990;
      when 15 then v_title := 'Маленькие женщины'; v_author := 'Louisa May Alcott'; v_price_cents := 1190;
      when 16 then v_title := 'Большая книга природы'; v_author := 'DK'; v_price_cents := 1890;
      when 17 then v_title := 'Атлас путешествий'; v_author := 'Lonely Planet'; v_price_cents := 2590;
      when 18 then v_title := '1984. Коллекционное издание'; v_author := 'George Orwell'; v_price_cents := 2990;
      when 19 then v_title := 'AI Superpowers'; v_author := 'Kai-Fu Lee'; v_price_cents := 2190;
      when 20 then v_title := 'Иллюстрированный атлас космоса'; v_author := 'DK'; v_price_cents := 2790;
      when 21 then v_title := 'Python для начинающих'; v_author := 'Eric Matthes'; v_price_cents := 1490;
      when 22 then v_title := 'Города и архитектура'; v_author := 'Phaidon Editors'; v_price_cents := 2390;
      else raise exception 'UNKNOWN_BOOK_ID';
    end case;

    v_subtotal_cents := v_subtotal_cents + (v_price_cents * v_quantity);
    v_items := v_items || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'id', v_book_id,
        'title', v_title,
        'author', v_author,
        'unit_price_cents', v_price_cents,
        'quantity', v_quantity,
        'line_total_cents', v_price_cents * v_quantity
      )
    );
  end loop;

  -- Demo international shipping: $7.95, free for orders of $75 or more.
  v_shipping_cents := case when v_subtotal_cents >= 7500 then 0 else 795 end;

  insert into public.bookstore_orders (
    order_number, user_id, currency, subtotal_cents, shipping_cents, total_cents,
    payment_method, payment_status, order_status, shipping_address, items, demo_mode
  ) values (
    p_order_number, v_user_id, 'USD', v_subtotal_cents, v_shipping_cents,
    v_subtotal_cents + v_shipping_cents, p_payment_method, 'succeeded_demo',
    'processing', p_shipping_address, v_items, true
  )
  returning * into v_order;

  return pg_catalog.jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'currency', v_order.currency,
    'subtotal_cents', v_order.subtotal_cents,
    'shipping_cents', v_order.shipping_cents,
    'total_cents', v_order.total_cents,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'order_status', v_order.order_status,
    'items', v_order.items,
    'created_at', v_order.created_at
  );
end;
$$;

revoke all on function public.create_bookstore_demo_order(text, text, jsonb, jsonb) from public, anon;
grant execute on function public.create_bookstore_demo_order(text, text, jsonb, jsonb) to authenticated;
