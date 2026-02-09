import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { workspaceId } = await params;
    const supabase = createAdminClient();

    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name, stripe_customer_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    if (!workspace.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Workspace has no Stripe customer. Only managed workspaces support card verification.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com';

    const session = await stripe.checkout.sessions.create({
      customer: workspace.stripe_customer_id,
      mode: 'setup',
      payment_method_types: ['card'],
      metadata: { workspace_id: workspaceId },
      success_url: `${appUrl}/admin/workspaces/${workspaceId}?card_verified=success`,
      cancel_url: `${appUrl}/admin/workspaces/${workspaceId}?card_verified=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Verify card error:', error);
    return NextResponse.json({ error: 'Failed to create verification session' }, { status: 500 });
  }
}
