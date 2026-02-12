import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // Get current period dates (start of month to now)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endOfMonth = now.toISOString().split('T')[0];

  // Get user's live streams
  const { data: streams } = await supabaseAdmin
    .from('live_streams')
    .select('id, name')
    .eq('user_id', user.id);

  if (!streams || streams.length === 0) {
    return NextResponse.json({
      period_start: startOfMonth,
      period_end: endOfMonth,
      total_minutes: 0,
      total_cost_cents: 0,
      streams: [],
    });
  }

  const streamIds = streams.map((s) => s.id);

  // Get usage records for current period
  const { data: usageRecords } = await supabaseAdmin
    .from('stream_usage_records')
    .select('live_stream_id, minutes_watched, billable_amount_cents, recorded_at')
    .in('live_stream_id', streamIds)
    .gte('recorded_at', startOfMonth)
    .lte('recorded_at', endOfMonth)
    .order('recorded_at', { ascending: false });

  // Aggregate by stream
  const streamUsageMap = new Map<
    string,
    { minutes: number; cost_cents: number }
  >();

  for (const record of usageRecords ?? []) {
    const existing = streamUsageMap.get(record.live_stream_id) || {
      minutes: 0,
      cost_cents: 0,
    };
    existing.minutes += record.minutes_watched;
    existing.cost_cents += record.billable_amount_cents;
    streamUsageMap.set(record.live_stream_id, existing);
  }

  const streamUsage = streams.map((s) => {
    const usage = streamUsageMap.get(s.id);
    return {
      stream_id: s.id,
      stream_name: s.name,
      minutes: usage?.minutes ?? 0,
      cost_cents: usage?.cost_cents ?? 0,
    };
  });

  const totalMinutes = streamUsage.reduce((sum, s) => sum + s.minutes, 0);
  const totalCostCents = streamUsage.reduce((sum, s) => sum + s.cost_cents, 0);

  return NextResponse.json({
    period_start: startOfMonth,
    period_end: endOfMonth,
    total_minutes: totalMinutes,
    total_cost_cents: totalCostCents,
    streams: streamUsage,
  });
}
