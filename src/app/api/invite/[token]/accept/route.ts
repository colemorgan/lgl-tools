import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { full_name, email, password } = body;

    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: 'full_name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Look up and validate the invite
    const { data: invite, error: inviteError } = await supabase
      .from('client_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    }

    if (invite.accepted_at) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 });
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
    }

    // If the invite was targeted at a specific email, enforce it
    if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite is for a different email address' },
        { status: 403 }
      );
    }

    // Create the user via Supabase auth (admin API to skip email confirmation)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in instead.' },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;

    // Link the user to the billing client
    const { error: updateClientError } = await supabase
      .from('billing_clients')
      .update({
        user_id: userId,
        status: 'active',
      })
      .eq('id', invite.billing_client_id);

    if (updateClientError) throw updateClientError;

    // Mark the invite as accepted
    const { error: acceptError } = await supabase
      .from('client_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    if (acceptError) throw acceptError;

    return NextResponse.json({
      message: 'Account created successfully. You can now log in.',
      user_id: userId,
    });
  } catch (error) {
    console.error('Invite accept error:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
