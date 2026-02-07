import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getLiveInput, deleteLiveInput } from '@/lib/cloudflare';
import type { LiveStream } from '@/types';

interface RouteParams {
  params: Promise<{ streamId: string }>;
}

/**
 * GET /api/streams/[streamId] — Get stream details + live status from Cloudflare
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { streamId } = await params;

  try {
    const supabase = createAdminClient();

    const { data: stream, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .eq('user_id', user.id)
      .single();

    if (error || !stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    // Fetch live status from Cloudflare
    let cloudflareStatus = 'unknown';
    try {
      const liveInput = await getLiveInput(stream.cloudflare_live_input_id);
      cloudflareStatus = liveInput.status?.current ?? 'unknown';

      // Sync status to our database
      const newStatus =
        cloudflareStatus === 'connected'
          ? 'connected'
          : stream.status === 'connected'
            ? 'disconnected'
            : stream.status;

      if (newStatus !== stream.status) {
        await supabase
          .from('live_streams')
          .update({ status: newStatus })
          .eq('id', streamId);
        stream.status = newStatus;
      }
    } catch {
      // If Cloudflare API fails, return DB state
    }

    return NextResponse.json({
      ...(stream as LiveStream),
      cloudflare_status: cloudflareStatus,
    });
  } catch (error) {
    console.error('Get stream error:', error);
    return NextResponse.json({ error: 'Failed to fetch stream' }, { status: 500 });
  }
}

/**
 * DELETE /api/streams/[streamId] — Delete a stream (also removes from Cloudflare)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { streamId } = await params;

  try {
    const supabase = createAdminClient();

    const { data: stream, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('id', streamId)
      .eq('user_id', user.id)
      .single();

    if (error || !stream) {
      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    // Delete from Cloudflare
    try {
      await deleteLiveInput(stream.cloudflare_live_input_id);
    } catch {
      // Log but don't block deletion if Cloudflare cleanup fails
      console.error('Failed to delete Cloudflare live input:', stream.cloudflare_live_input_id);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('live_streams')
      .delete()
      .eq('id', streamId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete stream error:', error);
    return NextResponse.json({ error: 'Failed to delete stream' }, { status: 500 });
  }
}
