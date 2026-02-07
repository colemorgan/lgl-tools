import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { BillingClient, ScheduledCharge } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has a billing client record
  const { data: billingClient, error: clientError } = await supabase
    .from('billing_clients')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (clientError || !billingClient) {
    return NextResponse.json({ billing_client: null, charges: [] });
  }

  // Fetch all charges for this billing client
  const { data: charges, error: chargesError } = await supabase
    .from('scheduled_charges')
    .select('*')
    .eq('billing_client_id', billingClient.id)
    .order('scheduled_date', { ascending: false });

  if (chargesError) {
    console.error('Error fetching charges:', chargesError);
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }

  return NextResponse.json({
    billing_client: billingClient as BillingClient,
    charges: (charges ?? []) as ScheduledCharge[],
  });
}
