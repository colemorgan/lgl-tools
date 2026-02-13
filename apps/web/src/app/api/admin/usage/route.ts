import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { aggregateUsageForBilling } from '@lgl/usage-tracking';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const period = searchParams.get('period') ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const supabase = createAdminClient();

    // Check if usage_events table exists (migration may not be applied yet)
    const { error: tableCheck } = await supabase
      .from('usage_events')
      .select('id')
      .limit(0);

    if (tableCheck) {
      return NextResponse.json({ aggregates: [], billing_period: period });
    }

    const result = await aggregateUsageForBilling(supabase, period);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Admin usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
