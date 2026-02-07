import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLiveInput, deleteLiveInput, getHlsPlaybackUrl } from '@/lib/cloudflare';
import type { LiveStream } from '@/types';

/**
 * GET /api/streams — List the current user's live streams
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: streams, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(streams as LiveStream[]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('List streams error:', error);
    return NextResponse.json({ error: `Failed to fetch streams: ${message}` }, { status: 500 });
  }
}

/**
 * POST /api/streams — Create a new live stream
 * Body: { name?: string }
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const name = body.name || `Stream ${new Date().toLocaleString()}`;

    const supabase = createAdminClient();

    // Look up billing_client_id for this user (if any)
    const { data: billingClient } = await supabase
      .from('billing_clients')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['active', 'pending_setup'])
      .maybeSingle();

    const billingClientId = billingClient?.id ?? null;

    // Create live input on Cloudflare with metadata for auditability
    const meta: Record<string, string> = {
      user_id: user.id,
      user_email: user.email ?? '',
      created_via: 'lgl-tools',
    };
    if (billingClientId) {
      meta.billing_client_id = billingClientId;
    }

    const liveInput = await createLiveInput(meta);

    const hlsPlaybackUrl = getHlsPlaybackUrl(liveInput.uid);

    // Persist in database — clean up Cloudflare resource if this fails
    const { data: stream, error } = await supabase
      .from('live_streams')
      .insert({
        user_id: user.id,
        billing_client_id: billingClientId,
        cloudflare_live_input_id: liveInput.uid,
        name,
        rtmp_url: liveInput.rtmps.url,
        rtmp_stream_key: liveInput.rtmps.streamKey,
        hls_playback_url: hlsPlaybackUrl,
        status: 'created',
      })
      .select()
      .single();

    if (error) {
      await deleteLiveInput(liveInput.uid).catch((cleanupErr) =>
        console.error('Failed to clean up Cloudflare live input after DB error:', cleanupErr)
      );
      throw error;
    }

    return NextResponse.json(stream as LiveStream, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Create stream error:', error);
    return NextResponse.json({ error: `Failed to create stream: ${message}` }, { status: 500 });
  }
}
