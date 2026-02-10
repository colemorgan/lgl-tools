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

    // Look up billing client via workspace membership first, then fallback to direct
    const [{ data: membership }, { data: directClient }, { data: profile }] = await Promise.all([
      supabase
        .from('workspace_members')
        .select('workspace_id, workspaces!inner(billing_client_id, name)')
        .eq('user_id', user.id)
        .eq('workspaces.status', 'active')
        .limit(1)
        .maybeSingle(),
      supabase
        .from('billing_clients')
        .select('id, name')
        .eq('user_id', user.id)
        .in('status', ['active', 'pending_setup'])
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single(),
    ]);

    const wsData = membership?.workspaces as unknown as { billing_client_id: string | null; name: string } | null;
    const billingClientId = wsData?.billing_client_id ?? directClient?.id ?? null;
    const clientNameRaw = wsData?.name ?? directClient?.name ?? null;

    if (!billingClientId || !clientNameRaw) {
      return NextResponse.json(
        { error: 'A billing client must be set up before creating a live stream' },
        { status: 403 }
      );
    }

    const clientName = clientNameRaw.replace(/\s+/g, '-').toLowerCase();
    const userName = (profile?.full_name ?? user.email ?? 'unknown').replace(/\s+/g, '-').toLowerCase();

    // Build Cloudflare live input name: lgl_clientName_userName_date
    const dateStr = new Date().toISOString().slice(0, 10);
    const cfName = `lgl_${clientName}_${userName}_${dateStr}`;

    const meta: Record<string, string> = {
      name: cfName,
      user_id: user.id,
      user_email: user.email ?? '',
      billing_client_id: billingClientId,
      created_via: 'lgl-tools',
    };

    const liveInput = await createLiveInput(meta, billingClientId);

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
