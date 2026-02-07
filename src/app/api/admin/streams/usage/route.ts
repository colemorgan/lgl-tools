import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStreamMinutesViewed } from '@/lib/cloudflare';

/**
 * GET /api/admin/streams/usage?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Fetches usage for all live streams in the given date range,
 * updates the stream_usage_records table, and returns a summary.
 *
 * Billing rate: $0.12 per hour watched per viewer = $0.002 per minute
 * Cloudflare cost: $1 per 1,000 minutes = $0.001 per minute
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'start and end query parameters are required (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    // Get all live streams
    const { data: streams, error } = await supabase
      .from('live_streams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const COST_PER_MINUTE = 0.1; // $0.001 in cents
    const BILL_PER_MINUTE = 0.2; // $0.002 in cents ($0.12/hr)

    // Build list of dates in the range so each day gets its own record.
    // This prevents overlapping queries from double-counting usage.
    const dates: string[] = [];
    const current = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const usageResults = await Promise.all(
      (streams ?? []).map(async (stream) => {
        let totalMinutes = 0;

        // Query and upsert per-day to align with the unique constraint
        for (const date of dates) {
          const minutesViewed = await getStreamMinutesViewed(
            stream.cloudflare_live_input_id,
            date,
            date
          );

          totalMinutes += minutesViewed;

          if (minutesViewed > 0) {
            const costDeliveryCents = Math.round(minutesViewed * COST_PER_MINUTE);
            const billableAmountCents = Math.round(minutesViewed * BILL_PER_MINUTE);

            const { error: upsertError } = await supabase.from('stream_usage_records').upsert(
              {
                live_stream_id: stream.id,
                billing_client_id: stream.billing_client_id,
                minutes_watched: minutesViewed,
                recorded_at: date,
                cost_delivery_cents: costDeliveryCents,
                billable_amount_cents: billableAmountCents,
              },
              { onConflict: 'live_stream_id,recorded_at' }
            );

            if (upsertError) {
              console.error(`Failed to upsert usage for stream ${stream.id} on ${date}:`, upsertError);
              throw upsertError;
            }
          }
        }

        const costDeliveryCents = Math.round(totalMinutes * COST_PER_MINUTE);
        const billableAmountCents = Math.round(totalMinutes * BILL_PER_MINUTE);

        return {
          stream_id: stream.id,
          stream_name: stream.name,
          user_id: stream.user_id,
          billing_client_id: stream.billing_client_id,
          minutes_viewed: totalMinutes,
          cost_delivery_cents: costDeliveryCents,
          billable_amount_cents: billableAmountCents,
        };
      })
    );

    const totalMinutes = usageResults.reduce((sum, r) => sum + r.minutes_viewed, 0);
    const totalCost = usageResults.reduce((sum, r) => sum + r.cost_delivery_cents, 0);
    const totalBillable = usageResults.reduce((sum, r) => sum + r.billable_amount_cents, 0);

    return NextResponse.json({
      period: { start: startDate, end: endDate },
      streams: usageResults,
      totals: {
        minutes_viewed: totalMinutes,
        cost_delivery_cents: totalCost,
        billable_amount_cents: totalBillable,
      },
    });
  } catch (error) {
    console.error('Admin stream usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch stream usage' }, { status: 500 });
  }
}
