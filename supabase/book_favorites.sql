create table if not exists public.book_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id integer not null check (book_id > 0),
  created_at timestamptz not null default now(),
  primary key (user_id, book_id)
);
create index if not exists book_favorites_user_id_idx on public.book_favorites(user_id);
alter table public.book_favorites enable row level security;
revoke all on table public.book_favorites from anon, authenticated;
grant select, insert, delete on table public.book_favorites to authenticated;
drop policy if exists "Read own favorite books" on public.book_favorites;
create policy "Read own favorite books" on public.book_favorites for select to authenticated
using ((select auth.uid()) = user_id);
drop policy if exists "Save own favorite books" on public.book_favorites;
create policy "Save own favorite books" on public.book_favorites for insert to authenticated
with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own favorite books" on public.book_favorites;
create policy "Delete own favorite books" on public.book_favorites for delete to authenticated
using ((select auth.uid()) = user_id);
