import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { count: trialing },
      { count: expiredTrials },
      { count: billingClients },
      { count: pendingCharges },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trialing'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'expired_trial'),
      supabase.from('billing_clients').select('*', { count: 'exact', head: true }),
      supabase.from('scheduled_charges').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      activeSubscribers: activeSubscribers ?? 0,
      trialing: trialing ?? 0,
      expiredTrials: expiredTrials ?? 0,
      billingClients: billingClients ?? 0,
      pendingCharges: pendingCharges ?? 0,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
