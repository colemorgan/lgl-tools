-- Queue table for Cloudflare live inputs that need cleanup.
-- Rows are inserted by a trigger when live_streams records are deleted
-- (e.g. via cascade from auth.users deletion) and processed by a cron job.

create table if not exists public.cloudflare_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  cloudflare_live_input_id text not null,
  created_at timestamptz not null default now()
);

alter table public.cloudflare_cleanup_queue enable row level security;

create policy "Service role can manage cleanup queue"
  on public.cloudflare_cleanup_queue for all
  using (auth.role() = 'service_role');

-- Trigger: capture cloudflare_live_input_id before a live_streams row is deleted
create or replace function public.queue_cloudflare_cleanup()
returns trigger as $$
begin
  insert into public.cloudflare_cleanup_queue (cloudflare_live_input_id)
  values (old.cloudflare_live_input_id);
  return old;
end;
$$ language plpgsql security definer;

create trigger live_streams_before_delete_cleanup
  before delete on public.live_streams
  for each row
  execute function public.queue_cloudflare_cleanup();
