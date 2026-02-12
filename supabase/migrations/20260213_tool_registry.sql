-- LGL-70: Tool Registry, workspace_tools migration, and usage_events
-- ============================================================

-- Step 1: Create tools table
CREATE TABLE public.tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'production',
  icon TEXT NOT NULL DEFAULT 'Clock',
  route_path TEXT,
  tool_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (tool_type IN ('standard', 'metered', 'external')),
  billing_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_advertised BOOLEAN NOT NULL DEFAULT true,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  tier_access TEXT[] NOT NULL DEFAULT ARRAY['active']::TEXT[],
  requires_workspace BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_tools_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 2: Seed 4 tools (current production slugs)
INSERT INTO public.tools (slug, name, description, category, icon, route_path, tool_type, billing_config, is_advertised, is_enabled, tier_access, requires_workspace, sort_order) VALUES
  ('timer', 'Timer', 'Keep every segment on schedule with precision countdowns and alerts.', 'Stage Management', 'Clock', '/tools/timer', 'standard', '{"type": "included"}', true, true, ARRAY['active','trialing'], false, 1),
  ('prompter', 'Prompter', 'Feed scripts to talent smoothly so every line lands on cue.', 'Stage Management', 'Scroll', '/tools/prompter', 'standard', '{"type": "included"}', true, true, ARRAY['active','trialing'], false, 2),
  ('vog', 'VOG', 'Deliver polished voice-of-god announcements without a booth.', 'Audio', 'Volume2', '/tools/vog', 'standard', '{"type": "included"}', true, true, ARRAY['active','trialing'], false, 3),
  ('live-stream', 'Backup Live Stream', 'Spin up a backup live stream with RTMP ingest and a hosted player page.', 'Streaming', 'Radio', '/tools/live-stream', 'metered', '{"type": "metered", "rate": null, "unit": "minute"}', true, true, ARRAY['active'], true, 10);

-- Step 3: Migrate workspace_tools (text slug -> UUID FK)

-- Add UUID column
ALTER TABLE public.workspace_tools ADD COLUMN tool_id_new UUID;

-- Populate via slug mapping
UPDATE public.workspace_tools wt SET tool_id_new = t.id FROM public.tools t WHERE wt.tool_id = t.slug;

-- Safety: fail if any unmapped slugs
ALTER TABLE public.workspace_tools ALTER COLUMN tool_id_new SET NOT NULL;

-- Drop old unique constraint + text column
ALTER TABLE public.workspace_tools DROP CONSTRAINT workspace_tools_workspace_id_tool_id_key;
ALTER TABLE public.workspace_tools DROP COLUMN tool_id;
ALTER TABLE public.workspace_tools RENAME COLUMN tool_id_new TO tool_id;

-- Add FK + unique constraint
ALTER TABLE public.workspace_tools
  ADD CONSTRAINT workspace_tools_tool_id_fkey FOREIGN KEY (tool_id) REFERENCES public.tools(id) ON DELETE CASCADE,
  ADD CONSTRAINT workspace_tools_workspace_id_tool_id_unique UNIQUE (workspace_id, tool_id);

-- Rename enabled -> is_enabled
ALTER TABLE public.workspace_tools RENAME COLUMN enabled TO is_enabled;

-- Add new columns
ALTER TABLE public.workspace_tools
  ADD COLUMN pricing_override JSONB,
  ADD COLUMN config_override JSONB,
  ADD COLUMN enabled_at TIMESTAMPTZ,
  ADD COLUMN disabled_at TIMESTAMPTZ,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill enabled_at
UPDATE public.workspace_tools SET enabled_at = created_at WHERE is_enabled = true;

CREATE TRIGGER set_workspace_tools_updated_at BEFORE UPDATE ON public.workspace_tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Step 4: Create usage_events table
CREATE TABLE public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit_cost_snapshot NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  billing_period TEXT NOT NULL,
  billed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_billing ON public.usage_events (workspace_id, billing_period, tool_id) WHERE billed = false;
CREATE INDEX idx_usage_events_created_at ON public.usage_events (created_at);
CREATE INDEX idx_usage_events_user ON public.usage_events (user_id, created_at);

-- Step 5: RLS policies

-- tools: readable by authenticated users
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tools"
  ON public.tools FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role has full access to tools"
  ON public.tools FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- workspace_tools: readable by workspace members
-- (RLS already enabled from initial migration, add new policies for updated columns)
-- Drop existing policies first to recreate with correct column names
DROP POLICY IF EXISTS "Members can view their workspace tools" ON public.workspace_tools;
DROP POLICY IF EXISTS "Service role manages workspace tools" ON public.workspace_tools;

CREATE POLICY "Members can view their workspace tools"
  ON public.workspace_tools FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages workspace tools"
  ON public.workspace_tools FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- usage_events: users can read their own, admins can read all
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own usage events"
  ON public.usage_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role manages usage events"
  ON public.usage_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 6: Auto-populate trigger for self_serve workspaces
CREATE OR REPLACE FUNCTION public.auto_enable_standard_tools()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'self_serve' THEN
    INSERT INTO public.workspace_tools (workspace_id, tool_id, is_enabled, enabled_at)
    SELECT NEW.id, t.id, true, now()
    FROM public.tools t
    WHERE t.tool_type = 'standard' AND t.is_enabled = true
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_enable_standard_tools_on_workspace
  AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.auto_enable_standard_tools();
