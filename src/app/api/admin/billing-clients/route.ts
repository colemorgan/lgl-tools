import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { createOrRetrieveCustomer } from '@/lib/stripe';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    const { data: clients, error } = await supabase
      .from('billing_clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with user email and pending charge count
    const enriched = await Promise.all(
      (clients ?? []).map(async (client) => {
        const { data: userData } = await supabase.auth.admin.getUserById(client.user_id);
        const { count } = await supabase
          .from('scheduled_charges')
          .select('*', { count: 'exact', head: true })
          .eq('billing_client_id', client.id)
          .eq('status', 'pending');

        return {
          ...client,
          user_email: userData?.user?.email ?? null,
          pending_charges_count: count ?? 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Admin billing clients list error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { user_id, name, notes } = body;

    if (!user_id || !name) {
      return NextResponse.json({ error: 'user_id and name are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Ensure user exists and get email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, stripe_customer_id')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { data: userData } = await supabase.auth.admin.getUserById(user_id);
    const email = userData?.user?.email;

    if (!email) {
      return NextResponse.json({ error: 'User has no email' }, { status: 400 });
    }

    // Ensure Stripe customer exists
    const stripeCustomerId = await createOrRetrieveCustomer(
      user_id,
      email,
      profile.full_name
    );

    // Create billing client
    const { data: client, error } = await supabase
      .from('billing_clients')
      .insert({
        user_id,
        name,
        notes: notes || null,
        stripe_customer_id: stripeCustomerId,
        status: 'pending_setup',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'A billing client already exists for this user' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Admin create billing client error:', error);
    return NextResponse.json({ error: 'Failed to create billing client' }, { status: 500 });
  }
}
