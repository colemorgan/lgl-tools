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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();

    const [
      { count: totalUsers },
      { count: technicianUsers },
      { count: freeTrialUsers },
      { count: expiredTrials },
      { count: pastDueUsers },
      { count: workspaceMembers },
      { count: totalWorkspaces },
      { count: selfServeWorkspaces },
      { count: managedWorkspaces },
      { count: activeWorkspaces },
      { data: chargesThisMonth },
      { data: chargesLastMonth },
      { data: meteredUsageThisMonth },
      { count: pendingChargesCount },
      { data: upcomingCharges },
      { data: recentSignups },
      { data: recentSucceeded },
      { data: recentFailed },
    ] = await Promise.all([
      // User counts
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'active'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'trialing'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'expired_trial'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'past_due'),

      // Workspace member count (total memberships)
      supabase.from('workspace_members').select('user_id', { count: 'exact', head: true }),

      // Workspace counts
      supabase.from('workspaces').select('*', { count: 'exact', head: true }),
      supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('type', 'self_serve'),
      supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('type', 'managed'),
      supabase.from('workspaces').select('*', { count: 'exact', head: true }).eq('status', 'active'),

      // Revenue: custom invoices this month
      supabase
        .from('scheduled_charges')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('processed_at', startOfMonth),

      // Revenue: custom invoices last month
      supabase
        .from('scheduled_charges')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('processed_at', startOfLastMonth)
        .lte('processed_at', endOfLastMonth),

      // Revenue: metered usage this month
      supabase
        .from('stream_usage_records')
        .select('billable_amount_cents')
        .gte('recorded_at', startOfMonth.split('T')[0]),

      // Pending charges total count
      supabase.from('scheduled_charges').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

      // Upcoming charges (10 nearest pending)
      supabase
        .from('scheduled_charges')
        .select('id, billing_client_id, amount_cents, currency, description, scheduled_date, billing_clients(name)')
        .eq('status', 'pending')
        .order('scheduled_date', { ascending: true })
        .limit(10),

      // Recent signups (10 most recent)
      supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Recent succeeded charges
      supabase
        .from('scheduled_charges')
        .select('id, amount_cents, currency, description, processed_at, billing_clients(name)')
        .eq('status', 'succeeded')
        .order('processed_at', { ascending: false })
        .limit(10),

      // Recent failed charges
      supabase
        .from('scheduled_charges')
        .select('id, amount_cents, currency, description, failure_reason, processed_at, billing_clients(name)')
        .eq('status', 'failed')
        .order('processed_at', { ascending: false })
        .limit(10),
    ]);

    const customInvoicesThisMonth = (chargesThisMonth ?? []).reduce(
      (sum, c) => sum + (c.amount_cents ?? 0),
      0
    );
    const customInvoicesLastMonth = (chargesLastMonth ?? []).reduce(
      (sum, c) => sum + (c.amount_cents ?? 0),
      0
    );
    const meteredUsageTotal = (meteredUsageThisMonth ?? []).reduce(
      (sum, r) => sum + (r.billable_amount_cents ?? 0),
      0
    );

    // Build activity feed: merge signups, succeeded, failed — sort by timestamp desc, limit 10
    type ActivityItem = {
      type: 'signup' | 'payment_succeeded' | 'payment_failed';
      description: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
    };

    const activities: ActivityItem[] = [];

    for (const signup of recentSignups ?? []) {
      activities.push({
        type: 'signup',
        description: `${signup.full_name || 'New user'} signed up`,
        timestamp: signup.created_at,
        metadata: { userId: signup.id },
      });
    }

    for (const charge of recentSucceeded ?? []) {
      const clientName =
        (charge.billing_clients as unknown as { name: string } | null)?.name ?? 'Unknown client';
      activities.push({
        type: 'payment_succeeded',
        description: `Payment of $${((charge.amount_cents ?? 0) / 100).toFixed(2)} from ${clientName}`,
        timestamp: charge.processed_at ?? new Date().toISOString(),
        metadata: { chargeId: charge.id },
      });
    }

    for (const charge of recentFailed ?? []) {
      const clientName =
        (charge.billing_clients as unknown as { name: string } | null)?.name ?? 'Unknown client';
      activities.push({
        type: 'payment_failed',
        description: `Payment failed for ${clientName}: ${charge.failure_reason || 'Unknown reason'}`,
        timestamp: charge.processed_at ?? new Date().toISOString(),
        metadata: { chargeId: charge.id },
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 10);

    // Format upcoming charges with client name + workspace info
    const formattedUpcoming = await Promise.all(
      (upcomingCharges ?? []).map(async (c) => {
        const clientName =
          (c.billing_clients as unknown as { name: string } | null)?.name ?? 'Unknown';

        // Find workspace linked to this billing client
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id, name')
          .eq('billing_client_id', c.billing_client_id)
          .maybeSingle();

        return {
          id: c.id,
          billing_client_id: c.billing_client_id,
          billing_client_name: clientName,
          workspace_id: workspace?.id ?? null,
          workspace_name: workspace?.name ?? null,
          amount_cents: c.amount_cents,
          currency: c.currency,
          description: c.description,
          scheduled_date: c.scheduled_date,
        };
      })
    );

    // Calculate forecasted revenue:
    // 1. Subscription revenue = active subscribers * $9/mo
    const subscriptionRevenue = (technicianUsers ?? 0) * 900; // cents

    // 2. Pending charges grouped by month
    const { data: allPendingCharges } = await supabase
      .from('scheduled_charges')
      .select('amount_cents, scheduled_date')
      .eq('status', 'pending')
      .order('scheduled_date', { ascending: true });

    const pendingByMonth: Record<string, number> = {};
    for (const c of allPendingCharges ?? []) {
      const month = c.scheduled_date.substring(0, 7); // YYYY-MM
      pendingByMonth[month] = (pendingByMonth[month] ?? 0) + c.amount_cents;
    }

    // Build forecast for current + next 2 months
    const forecastMonths: { month: string; subscriptions: number; pendingCharges: number; total: number }[] = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const pending = pendingByMonth[monthKey] ?? 0;
      forecastMonths.push({
        month: monthKey,
        subscriptions: subscriptionRevenue,
        pendingCharges: pending,
        total: subscriptionRevenue + pending,
      });
    }

    // 3. Failed charges count (for admin alert)
    const { count: failedChargesCount } = await supabase
      .from('scheduled_charges')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    return NextResponse.json({
      workspaces: {
        total: totalWorkspaces ?? 0,
        selfServe: selfServeWorkspaces ?? 0,
        managed: managedWorkspaces ?? 0,
        active: activeWorkspaces ?? 0,
      },
      users: {
        total: totalUsers ?? 0,
        technician: technicianUsers ?? 0,
        freeTrial: freeTrialUsers ?? 0,
        workspaceMembers: workspaceMembers ?? 0,
        expiredTrials: expiredTrials ?? 0,
        pastDue: pastDueUsers ?? 0,
      },
      revenue: {
        customInvoicesThisMonth,
        customInvoicesLastMonth,
        meteredUsageThisMonth: meteredUsageTotal,
      },
      forecast: forecastMonths,
      failedChargesCount: failedChargesCount ?? 0,
      pendingChargesCount: pendingChargesCount ?? 0,
      upcomingCharges: formattedUpcoming,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
