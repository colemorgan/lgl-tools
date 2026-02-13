import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import { aggregateUsageForBilling } from '@lgl/usage-tracking';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const wsContext = await getWorkspaceContext(user.id);

    if (!wsContext) {
      return NextResponse.json({ aggregates: [], billing_period: '' });
    }

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const period = searchParams.get('period') ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const admin = createAdminClient();

    // Check if usage_events table exists (migration may not be applied yet)
    const { error: tableCheck } = await admin
      .from('usage_events')
      .select('id')
      .limit(0);

    if (tableCheck) {
      return NextResponse.json({ aggregates: [], billing_period: period });
    }

    const result = await aggregateUsageForBilling(admin, period, wsContext.workspaceId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('User usage error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage data' }, { status: 500 });
  }
}
