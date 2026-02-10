import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveStreamStatus } from '@/types/database';

/**
 * Cloudflare Stream Live webhook handler.
 *
 * Receives notifications from the Cloudflare Notifications system when a
 * live input connects, disconnects, or errors. Updates the corresponding
 * live_streams row status in the database.
 *
 * Setup: In the Cloudflare dashboard → Notifications → Destinations, create
 * a webhook pointing to this route. If CLOUDFLARE_WEBHOOK_SECRET is set,
 * append ?secret=<value> to the URL so the handler can verify requests.
 *
 * @see https://developers.cloudflare.com/stream/stream-live/webhooks/
 */

interface CloudflareWebhookData {
  notification_name: string;
  input_id: string;
  event_type: 'live_input.connected' | 'live_input.disconnected' | 'live_input.errored';
  updated_at: string;
  live_input_errored?: {
    code: string;
    message?: string;
  };
}

interface CloudflareWebhookPayload {
  name: string;
  text: string;
  data: CloudflareWebhookData;
  ts: number;
}

const EVENT_TO_STATUS: Record<string, LiveStreamStatus> = {
  'live_input.connected': 'connected',
  'live_input.disconnected': 'disconnected',
  'live_input.errored': 'disconnected',
};

export async function POST(request: Request) {
  // Verify shared secret if configured
  const webhookSecret = process.env.CLOUDFLARE_WEBHOOK_SECRET;
  if (webhookSecret) {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');
    if (secret !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }
  }

  let payload: CloudflareWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { data } = payload;
  if (!data?.input_id || !data?.event_type) {
    return NextResponse.json({ error: 'Missing input_id or event_type' }, { status: 400 });
  }

  const newStatus = EVENT_TO_STATUS[data.event_type];
  if (!newStatus) {
    console.log(`Unhandled Cloudflare event type: ${data.event_type}`);
    return NextResponse.json({ received: true });
  }

  if (data.event_type === 'live_input.errored') {
    console.error(
      `Cloudflare live input error: input=${data.input_id} code=${data.live_input_errored?.code ?? 'unknown'} message=${data.live_input_errored?.message ?? 'none'}`
    );
  }

  const supabaseAdmin = createAdminClient();

  try {
    const { error } = await supabaseAdmin
      .from('live_streams')
      .update({ status: newStatus })
      .eq('cloudflare_live_input_id', data.input_id);

    if (error) {
      console.error('Failed to update stream status:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    console.log(`Stream status updated: input=${data.input_id} event=${data.event_type} status=${newStatus}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
