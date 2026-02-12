import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStreamMinutesViewed } from '@/lib/cloudflare';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cost per minute of delivery (Cloudflare Stream pricing: ~$1/1000 min)
const COST_PER_MINUTE_CENTS = 0.1;
// Markup for billing
const BILLING_MULTIPLIER = 2;

function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Sync yesterday's usage (complete day)
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const results = {
    streamsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [] as string[],
  };

  try {
    // Get all active live streams
    const { data: streams, error: streamsError } = await supabase
      .from('live_streams')
      .select('id, cloudflare_live_input_id, billing_client_id');

    if (streamsError) {
      return NextResponse.json(
        { error: `Failed to fetch streams: ${streamsError.message}` },
        { status: 500 }
      );
    }

    for (const stream of streams ?? []) {
      results.streamsProcessed++;

      // Check if we already have a record for this stream+date
      const { data: existing } = await supabase
        .from('stream_usage_records')
        .select('id')
        .eq('live_stream_id', stream.id)
        .eq('recorded_at', dateStr)
        .maybeSingle();

      if (existing) {
        results.recordsSkipped++;
        continue;
      }

      try {
        const minutes = await getStreamMinutesViewed(
          stream.cloudflare_live_input_id,
          dateStr,
          dateStr
        );

        // Only create records for non-zero usage
        if (minutes > 0) {
          const costDeliveryCents = Math.round(minutes * COST_PER_MINUTE_CENTS);
          const billableAmountCents = Math.round(
            minutes * COST_PER_MINUTE_CENTS * BILLING_MULTIPLIER
          );

          const { error: insertError } = await supabase
            .from('stream_usage_records')
            .insert({
              live_stream_id: stream.id,
              billing_client_id: stream.billing_client_id,
              minutes_watched: minutes,
              recorded_at: dateStr,
              cost_delivery_cents: costDeliveryCents,
              billable_amount_cents: billableAmountCents,
            });

          if (insertError) {
            results.errors.push(
              `Failed to insert usage for stream ${stream.id}: ${insertError.message}`
            );
          } else {
            results.recordsCreated++;
          }
        }
      } catch (cfError) {
        results.errors.push(
          `Cloudflare analytics error for stream ${stream.id}: ${cfError instanceof Error ? cfError.message : 'Unknown'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      date: dateStr,
      results,
    });
  } catch (error) {
    console.error('Usage sync cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}
