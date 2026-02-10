import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteLiveInput } from '@/lib/cloudflare';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * GET /api/cron/cloudflare-cleanup
 *
 * Processes the cloudflare_cleanup_queue table, deleting orphaned
 * Cloudflare live inputs that were left behind by cascade deletes.
 */
export async function GET(request: Request) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pending, error: fetchError } = await supabase
    .from('cloudflare_cleanup_queue')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  if (fetchError) {
    console.error('Failed to fetch cleanup queue:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ cleaned: 0, failed: 0 });
  }

  let cleaned = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await deleteLiveInput(item.cloudflare_live_input_id);
    } catch (err) {
      // Log but still remove from queue — Cloudflare returns 404 if already gone
      console.error(`Cloudflare cleanup failed for ${item.cloudflare_live_input_id}:`, err);
      failed++;
    }

    // Remove from queue regardless — retrying stale entries indefinitely is worse
    // than missing one cleanup. The admin usage endpoint will surface orphans.
    const { error: deleteError } = await supabase
      .from('cloudflare_cleanup_queue')
      .delete()
      .eq('id', item.id);

    if (deleteError) {
      console.error(`Failed to dequeue item ${item.id}:`, deleteError);
    } else if (failed === 0 || cleaned > 0) {
      cleaned++;
    }
  }

  return NextResponse.json({ cleaned, failed });
}
