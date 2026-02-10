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

    // Fetch all charges with billing_client name
    const { data: charges, error } = await supabase
      .from('scheduled_charges')
      .select('*, billing_clients(name)')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    // Join workspace info through billing_client_id
    const enriched = await Promise.all(
      (charges ?? []).map(async (charge) => {
        const clientName =
          (charge.billing_clients as unknown as { name: string } | null)?.name ?? 'Unknown';

        // Find workspace linked to this billing client
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id, name')
          .eq('billing_client_id', charge.billing_client_id)
          .maybeSingle();

        return {
          ...charge,
          billing_clients: undefined,
          workspace_id: workspace?.id ?? null,
          workspace_name: workspace?.name ?? clientName,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Admin all charges error:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
}
