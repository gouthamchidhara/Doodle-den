-- Doodle Den core schema (A3, copied exactly) + storage bucket and anon access to server_now().
create table public.family (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table public.kid_profile (
  id uuid primary key,
  family_id uuid not null references public.family(id) on delete cascade,
  nickname text not null,
  avatar_id text not null,
  age_mode text not null check (age_mode in ('little','big')),
  created_at timestamptz not null
);

create table public.time_rule (
  kid_id uuid primary key references public.kid_profile(id) on delete cascade,
  rules jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.usage_day (
  kid_id uuid not null references public.kid_profile(id) on delete cascade,
  day_key date not null,
  used_sec int not null,
  sessions int not null,
  extensions_used int not null,
  per_activity jsonb not null default '{}',
  primary key (kid_id, day_key)
);

create table public.artwork (
  id uuid primary key,
  kid_id uuid not null references public.kid_profile(id) on delete cascade,
  activity text not null,
  title text,
  storage_path text not null,
  created_at timestamptz not null,
  is_favorite boolean not null default false
);

alter table public.family enable row level security;
alter table public.kid_profile enable row level security;
alter table public.time_rule enable row level security;
alter table public.usage_day enable row level security;
alter table public.artwork enable row level security;

create policy "own family" on public.family
  for all using (parent_user_id = auth.uid()) with check (parent_user_id = auth.uid());

create policy "own kids" on public.kid_profile
  for all using (family_id in (select id from public.family where parent_user_id = auth.uid()))
  with check (family_id in (select id from public.family where parent_user_id = auth.uid()));

create policy "own rules" on public.time_rule
  for all using (kid_id in (select k.id from public.kid_profile k join public.family f on f.id = k.family_id where f.parent_user_id = auth.uid()));

create policy "own usage" on public.usage_day
  for all using (kid_id in (select k.id from public.kid_profile k join public.family f on f.id = k.family_id where f.parent_user_id = auth.uid()));

create policy "own art" on public.artwork
  for all using (kid_id in (select k.id from public.kid_profile k join public.family f on f.id = k.family_id where f.parent_user_id = auth.uid()));

-- server time for the lock engine
create or replace function public.server_now() returns timestamptz
  language sql stable as $$ select now() $$;

-- anon may read server time (A4 Clock rules)
grant execute on function public.server_now() to anon;

-- Private art bucket: <family_id>/<kid_id>/<artwork_id>.png, only the owning parent can read/write (signed URLs only).
insert into storage.buckets (id, name, public) values ('art', 'art', false) on conflict (id) do nothing;

create policy "own art files read" on storage.objects for select
  using (bucket_id = 'art' and (storage.foldername(name))[1] in (select id::text from public.family where parent_user_id = auth.uid()));
create policy "own art files write" on storage.objects for insert
  with check (bucket_id = 'art' and (storage.foldername(name))[1] in (select id::text from public.family where parent_user_id = auth.uid()));
create policy "own art files update" on storage.objects for update
  using (bucket_id = 'art' and (storage.foldername(name))[1] in (select id::text from public.family where parent_user_id = auth.uid()));
create policy "own art files delete" on storage.objects for delete
  using (bucket_id = 'art' and (storage.foldername(name))[1] in (select id::text from public.family where parent_user_id = auth.uid()));
