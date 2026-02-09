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

      // Workspace member count (distinct users)
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
        timestamp: charge.processed_at ?? charge.id,
        metadata: { chargeId: charge.id },
      });
    }

    for (const charge of recentFailed ?? []) {
      const clientName =
        (charge.billing_clients as unknown as { name: string } | null)?.name ?? 'Unknown client';
      activities.push({
        type: 'payment_failed',
        description: `Payment failed for ${clientName}: ${charge.failure_reason || 'Unknown reason'}`,
        timestamp: charge.processed_at ?? charge.id,
        metadata: { chargeId: charge.id },
      });
    }

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 10);

    // Format upcoming charges with client name
    const formattedUpcoming = (upcomingCharges ?? []).map((c) => ({
      id: c.id,
      billing_client_id: c.billing_client_id,
      billing_client_name:
        (c.billing_clients as unknown as { name: string } | null)?.name ?? 'Unknown',
      amount_cents: c.amount_cents,
      currency: c.currency,
      description: c.description,
      scheduled_date: c.scheduled_date,
    }));

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
      upcomingCharges: formattedUpcoming,
      recentActivity,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
