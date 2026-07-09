-- FormulaFix: миграция Supabase
-- Выполнить в Supabase Dashboard → SQL Editor (один раз)

-- ── Профили (создаются автоматически при регистрации) ────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free','pro')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Триггер: новая запись в auth.users → профиль
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Дневные квоты ─────────────────────────────────────────────
create table if not exists public.quotas (
  key text not null,
  date date not null default current_date,
  used int not null default 0,
  primary key (key, date)
);

-- RLS включён, политик нет → доступ только через service role
alter table public.quotas enable row level security;

-- Атомарный инкремент: возвращает новое used или -1 при превышении лимита
create or replace function public.increment_quota(p_key text, p_limit int)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_used int;
begin
  insert into public.quotas as q (key, date, used)
  values (p_key, current_date, 1)
  on conflict (key, date) do update
    set used = q.used + 1
    where q.used < p_limit
  returning used into v_used;

  if v_used is null then
    return -1;
  end if;
  return v_used;
end;
$$;

-- Чистка старых квот (опционально: включить pg_cron в Dashboard → Extensions)
-- select cron.schedule('purge-quotas', '0 3 * * *',
--   $$delete from public.quotas where date < current_date - 7$$);
