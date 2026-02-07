import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend';
import ClientInviteEmail from '../../../../../../emails/client-invite';

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, notes, email } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Create billing client without a user (pending invite)
    const { data: client, error: clientError } = await supabase
      .from('billing_clients')
      .insert({
        name,
        notes: notes || null,
        status: 'pending_setup',
      })
      .select()
      .single();

    if (clientError) {
      console.error('Failed to create billing client:', clientError);
      return NextResponse.json(
        { error: `Failed to create billing client: ${clientError.message}` },
        { status: 500 }
      );
    }

    // Generate a secure invite token
    const token = generateToken();

    // Create the invite record (expires in 7 days by default)
    const { data: invite, error: inviteError } = await supabase
      .from('client_invites')
      .insert({
        billing_client_id: client.id,
        token,
        email: email || null,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Failed to create invite record:', inviteError);
      return NextResponse.json(
        { error: `Failed to create invite: ${inviteError.message}` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com';
    const inviteUrl = `${appUrl}/invite/${token}`;

    // Send invite email if an email was provided
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `You've been invited to join ${name} on LGL Tools`,
          react: ClientInviteEmail({ companyName: name, inviteUrl }),
        });
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
        // Don't fail the request if email fails - admin can share the link manually
      }
    }

    return NextResponse.json(
      {
        client,
        invite,
        invite_url: inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin create invite error:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
