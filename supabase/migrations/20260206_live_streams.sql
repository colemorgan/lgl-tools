-- Live Streams & Usage Tracking
-- Run this migration in the Supabase SQL editor to set up tables
-- for the Backup Live Stream tool.

-- ── live_streams ─────────────────────────────────────────────────────────

create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_client_id uuid references public.billing_clients(id) on delete set null,
  cloudflare_live_input_id text not null unique,
  name text not null,
  rtmp_url text not null,
  rtmp_stream_key text not null,
  hls_playback_url text not null,
  status text not null default 'created'
    check (status in ('created', 'connected', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for user lookups (most common query)
create index if not exists idx_live_streams_user_id
  on public.live_streams(user_id);

-- Index for billing client lookups
create index if not exists idx_live_streams_billing_client_id
  on public.live_streams(billing_client_id);

-- Auto-update updated_at
create or replace function public.update_live_streams_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger live_streams_updated_at
  before update on public.live_streams
  for each row
  execute function public.update_live_streams_updated_at();

-- RLS: users can read/delete their own streams, service role does inserts
alter table public.live_streams enable row level security;

create policy "Users can view own streams"
  on public.live_streams for select
  using (auth.uid() = user_id);

create policy "Users can delete own streams"
  on public.live_streams for delete
  using (auth.uid() = user_id);

create policy "Service role can manage all streams"
  on public.live_streams for all
  using (auth.role() = 'service_role');

-- Allow public read for the hosted player page (only safe columns via API route)
create policy "Public can read stream for player"
  on public.live_streams for select
  using (true);

-- ── stream_usage_records ─────────────────────────────────────────────────

create table if not exists public.stream_usage_records (
  id uuid primary key default gen_random_uuid(),
  live_stream_id uuid not null references public.live_streams(id) on delete cascade,
  billing_client_id uuid references public.billing_clients(id) on delete set null,
  minutes_watched numeric not null default 0,
  recorded_at date not null,
  cost_delivery_cents integer not null default 0,
  billable_amount_cents integer not null default 0,
  created_at timestamptz not null default now(),

  -- One usage record per stream per day
  unique (live_stream_id, recorded_at)
);

create index if not exists idx_stream_usage_billing_client
  on public.stream_usage_records(billing_client_id);

create index if not exists idx_stream_usage_recorded_at
  on public.stream_usage_records(recorded_at);

alter table public.stream_usage_records enable row level security;

create policy "Service role can manage usage records"
  on public.stream_usage_records for all
  using (auth.role() = 'service_role');

create policy "Admins can view usage records"
  on public.stream_usage_records for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );
