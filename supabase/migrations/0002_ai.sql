-- AI Magic tables (A7, copied exactly) + family_shared flag for the Family Gallery.
alter table public.family add column ai_entitled boolean not null default false;

create table public.app_config (
  key text primary key,
  value jsonb not null
);
insert into public.app_config (key, value) values
  ('ai_free_for_all', 'true'),
  ('ai_caps_per_day', '{"coloring_page":10,"magic_sketch":10,"story":5,"guess":50,"coach":50,"digest":1}');

create table public.ai_consent (
  family_id uuid primary key references public.family(id) on delete cascade,
  consent_version int not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family(id) on delete cascade,
  feature text not null,
  status text not null check (status in ('ok','blocked','error','cap')),
  est_cost_usd numeric(10,5) not null default 0,
  created_at timestamptz not null default now()
);
create index on public.ai_usage (family_id, feature, created_at);

create table public.family_share (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.family(id) on delete cascade,
  token text not null unique,         -- 32 random url-safe chars
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.app_config enable row level security;   -- no client policies: server reads with service role
alter table public.ai_consent enable row level security;
alter table public.ai_usage enable row level security;
alter table public.family_share enable row level security;

create policy "own consent" on public.ai_consent for all
  using (family_id in (select id from public.family where parent_user_id = auth.uid()))
  with check (family_id in (select id from public.family where parent_user_id = auth.uid()));
create policy "own usage read" on public.ai_usage for select
  using (family_id in (select id from public.family where parent_user_id = auth.uid()));
create policy "own shares" on public.family_share for all
  using (family_id in (select id from public.family where parent_user_id = auth.uid()))
  with check (family_id in (select id from public.family where parent_user_id = auth.uid()));

alter table public.artwork add column family_shared boolean not null default false;
