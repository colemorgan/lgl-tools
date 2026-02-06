import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteParams {
  params: Promise<{ streamId: string }>;
}

/**
 * GET /api/live/[streamId] — Public endpoint returning playback info for a stream.
 * Only returns the data needed for the hosted player (no secrets like stream keys).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { streamId } = await params;

  try {
    const supabase = createAdminClient();

    const { data: stream, error } = await supabase
      .from('live_streams')
      .select('id, name, cloudflare_live_input_id, hls_playback_url, status, created_at')
      .eq('id', streamId)
      .single();

    if (error || !stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: stream.id,
      name: stream.name,
      cloudflare_live_input_id: stream.cloudflare_live_input_id,
      hls_playback_url: stream.hls_playback_url,
      status: stream.status,
    });
  } catch (error) {
    console.error('Public stream lookup error:', error);
    return NextResponse.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}
