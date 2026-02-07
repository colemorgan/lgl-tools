-- Drop the overly permissive public read policy on live_streams.
-- The hosted player page and /api/live/[streamId] route both use the
-- service-role admin client, so they bypass RLS and never needed this.
-- Leaving it in place let anyone with the anon key read all columns,
-- including rtmp_stream_key.

drop policy if exists "Public can read stream for player" on public.live_streams;
