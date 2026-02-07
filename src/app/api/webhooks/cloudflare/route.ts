import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LiveStreamStatus } from '@/types/database';
import crypto from 'crypto';

/**
 * Cloudflare Stream webhook handler
 *
 * Receives live_input.connected, live_input.disconnected, and
 * live_input.errored events and updates the live_streams table.
 *
 * Webhook signature is verified using the shared secret from Cloudflare.
 * @see https://developers.cloudflare.com/stream/stream-live/webhooks/
 */

interface CloudflareWebhookPayload {
  name: string;
  text: string;
  data: {
    notification_name: string;
    input_id: string;
    event_type: 'live_input.connected' | 'live_input.disconnected' | 'live_input.errored';
    updated_at: string;
    live_input_errored?: {
      error: {
        code: string;
        message: string;
      };
      video_codec?: string;
      audio_codec?: string;
    };
  };
  ts: number;
}

const EVENT_TO_STATUS: Record<string, LiveStreamStatus> = {
  'live_input.connected': 'connected',
  'live_input.disconnected': 'disconnected',
  'live_input.errored': 'disconnected',
};

function verifySignature(body: string, signatureHeader: string, secret: string): boolean {
  // Cloudflare sends: time=<timestamp>,sig1=<hmac>
  const parts = signatureHeader.split(',');
  const timePart = parts.find((p) => p.startsWith('time='));
  const sigPart = parts.find((p) => p.startsWith('sig1='));

  if (!timePart || !sigPart) return false;

  const timestamp = timePart.slice('time='.length);
  const signature = sigPart.slice('sig1='.length);

  // The signed content is "timestamp.body"
  const signedContent = `${timestamp}.${body}`;
  const expected = crypto.createHmac('sha256', secret).update(signedContent).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: Request) {
  const body = await request.text();
  const signatureHeader = request.headers.get('webhook-signature');

  const webhookSecret = process.env.CLOUDFLARE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLOUDFLARE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!signatureHeader || !verifySignature(body, signatureHeader, webhookSecret)) {
    console.error('Cloudflare webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: CloudflareWebhookPayload;
  try {
    payload = JSON.parse(body);
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
      `Cloudflare live input error: input=${data.input_id} code=${data.live_input_errored?.error?.code ?? 'unknown'} message=${data.live_input_errored?.error?.message ?? 'none'}`
    );
  }

  const supabaseAdmin = createAdminClient();

  try {
    const { error } = await supabaseAdmin
      .from('live_streams')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
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
